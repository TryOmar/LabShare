const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const { promisify } = require('util');
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });

const execAsync = promisify(exec);

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const DATABASE_PASSWORD = process.env.DATABASE_PASSWORD;
const DATABASE_URL = process.env.DATABASE_URL;

// Backup format: 'custom' (recommended, uses -Fc), 'plain' (SQL), or 'supabase-cli'
const BACKUP_FORMAT = process.env.BACKUP_FORMAT || 'custom';

if (!SUPABASE_URL) {
  console.error('❌ Missing NEXT_PUBLIC_SUPABASE_URL in .env.local');
  process.exit(1);
}

function getConnectionString() {
  // If DATABASE_URL is provided directly, use it (highest priority)
  if (DATABASE_URL) {
    console.log('📌 Using DATABASE_URL from environment\n');
    return DATABASE_URL;
  }

  // Extract project reference from Supabase URL
  const projectRef = SUPABASE_URL.match(/https:\/\/([^.]+)\.supabase\.co/)?.[1];
  if (!projectRef) {
    throw new Error('Could not extract project reference from SUPABASE_URL');
  }

  // Use DATABASE_PASSWORD if provided
  if (!DATABASE_PASSWORD) {
    console.error('\n❌ Missing DATABASE_PASSWORD in .env.local');
    console.error('\n📝 To use this script, add DATABASE_PASSWORD to your .env.local:');
    console.error(`   DATABASE_PASSWORD=your-database-password`);
    console.error('\n   Or provide DATABASE_URL directly:');
    console.error(`   DATABASE_URL=postgresql://postgres:password@host:port/database`);
    console.error('\n   Get connection details from: Supabase Dashboard → Settings → Database → Connection string\n');
    throw new Error('DATABASE_PASSWORD or DATABASE_URL is required');
  }

  const encodedPassword = encodeURIComponent(DATABASE_PASSWORD);
  
  // Use direct database connection (port 5432) for backups - more reliable than pooler
  // Format: postgresql://postgres:[PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres
  return `postgresql://postgres:${encodedPassword}@db.${projectRef}.supabase.co:5432/postgres`;
}

function getBackupFilename(format = 'custom') {
  const now = new Date();
  const timestamp = now.toISOString()
    .replace(/:/g, '-')
    .replace(/\..+/, '')
    .replace('T', '_');
  
  const extension = format === 'custom' ? '.dump' : '.sql';
  return `backup_${timestamp}${extension}`;
}

async function createBackupDirectory() {
  const backupsDir = path.join(__dirname, '..', 'backups');
  if (!fs.existsSync(backupsDir)) {
    fs.mkdirSync(backupsDir, { recursive: true });
    console.log(`📁 Created backups directory: ${backupsDir}`);
  }
  return backupsDir;
}

/**
 * Professional backup using pg_dump with custom format (-Fc)
 * This is the recommended format for PostgreSQL backups as it:
 * - Compresses the backup automatically
 * - Allows selective restore with pg_restore
 * - Is faster and more efficient than plain SQL
 * - Supports parallel restore
 */
/**
 * Check if pg_dump is available in the system
 */
async function isPgDumpAvailable() {
  try {
    await execAsync('pg_dump --version', { timeout: 5000 });
    return true;
  } catch {
    return false;
  }
}

async function backupUsingPgDumpCustom(connectionString, outputPath) {
  const url = new URL(connectionString);
  const host = url.hostname;
  const port = url.port || '5432';
  const database = url.pathname.slice(1) || 'postgres';
  const username = url.username;
  const password = url.password;

  // Check if pg_dump is available first
  const pgDumpAvailable = await isPgDumpAvailable();
  if (!pgDumpAvailable) {
    const error = new Error('pg_dump not found');
    error.code = 'ENOENT';
    error.isPgDumpMissing = true;
    throw error;
  }

  // Set PGPASSWORD environment variable for pg_dump
  process.env.PGPASSWORD = password;

  // Build pg_dump command with custom format (-Fc)
  const command = [
    'pg_dump',
    `--host=${host}`,
    `--port=${port}`,
    `--username=${username}`,
    `--dbname=${database}`,
    '--no-password', // Use PGPASSWORD env var instead
    '--verbose',
    '--format=custom', // Custom format (recommended) - compressed and allows selective restore
    '--compress=6', // Compression level (0-9, 6 is a good balance)
    '--no-owner', // Don't output commands to set ownership
    '--no-acl', // Don't output ACL (grant/revoke) commands
    `--file=${outputPath}`
  ].join(' ');

  console.log('🔄 Running pg_dump (custom format - recommended)...');
  console.log(`   Host: ${host}`);
  console.log(`   Port: ${port}`);
  console.log(`   Database: ${database}`);
  console.log(`   Format: Custom (compressed)`);
  console.log(`   Output: ${outputPath}\n`);

  try {
    const { stdout, stderr } = await execAsync(command, {
      maxBuffer: 50 * 1024 * 1024, // 50MB buffer for large databases
      env: { ...process.env, PGPASSWORD: password }
    });

    // pg_dump outputs progress to stderr, which is normal
    // Only show warnings/errors, not progress messages
    if (stderr) {
      const lines = stderr.split('\n');
      const importantLines = lines.filter(line => 
        line.includes('ERROR') || 
        line.includes('WARNING') ||
        (!line.includes('pg_dump: processing') && line.trim())
      );
      if (importantLines.length > 0) {
        console.log(importantLines.join('\n'));
      }
    }

    // Clean up password from environment
    delete process.env.PGPASSWORD;

    return true;
  } catch (error) {
    // Clean up password from environment
    delete process.env.PGPASSWORD;
    
    // Check if it's a "command not found" error
    if (error.message && (
      error.message.includes('not recognized') ||
      error.message.includes('not found') ||
      error.message.includes('ENOENT') ||
      error.code === 'ENOENT'
    )) {
      error.isPgDumpMissing = true;
    }
    throw error;
  }
}

/**
 * Backup using pg_dump with plain SQL format
 * Useful when you need a readable SQL file
 */
async function backupUsingPgDumpPlain(connectionString, outputPath) {
  const url = new URL(connectionString);
  const host = url.hostname;
  const port = url.port || '5432';
  const database = url.pathname.slice(1) || 'postgres';
  const username = url.username;
  const password = url.password;

  // Check if pg_dump is available first
  const pgDumpAvailable = await isPgDumpAvailable();
  if (!pgDumpAvailable) {
    const error = new Error('pg_dump not found');
    error.code = 'ENOENT';
    error.isPgDumpMissing = true;
    throw error;
  }

  process.env.PGPASSWORD = password;

  const command = [
    'pg_dump',
    `--host=${host}`,
    `--port=${port}`,
    `--username=${username}`,
    `--dbname=${database}`,
    '--no-password',
    '--verbose',
    '--clean', // Include DROP statements
    '--if-exists', // Use IF EXISTS for DROP statements
    '--no-owner',
    '--no-acl',
    '--format=plain', // Plain SQL format
    `--file=${outputPath}`
  ].join(' ');

  console.log('🔄 Running pg_dump (plain SQL format)...');
  console.log(`   Host: ${host}`);
  console.log(`   Port: ${port}`);
  console.log(`   Database: ${database}`);
  console.log(`   Format: Plain SQL`);
  console.log(`   Output: ${outputPath}\n`);

  try {
    const { stdout, stderr } = await execAsync(command, {
      maxBuffer: 50 * 1024 * 1024,
      env: { ...process.env, PGPASSWORD: password }
    });

    if (stderr) {
      const lines = stderr.split('\n');
      const importantLines = lines.filter(line => 
        line.includes('ERROR') || 
        line.includes('WARNING') ||
        (!line.includes('pg_dump: processing') && line.trim())
      );
      if (importantLines.length > 0) {
        console.log(importantLines.join('\n'));
      }
    }

    delete process.env.PGPASSWORD;
    return true;
  } catch (error) {
    delete process.env.PGPASSWORD;
    
    // Check if it's a "command not found" error
    if (error.message && (
      error.message.includes('not recognized') ||
      error.message.includes('not found') ||
      error.message.includes('ENOENT') ||
      error.code === 'ENOENT'
    )) {
      error.isPgDumpMissing = true;
    }
    throw error;
  }
}

/**
 * Professional backup using Supabase CLI
 * This method provides structured dumps (roles, schema, data separately)
 */
async function backupUsingSupabaseCLI(connectionString, backupsDir) {
  console.log('🔄 Using Supabase CLI for structured backup...\n');

  const timestamp = new Date().toISOString()
    .replace(/:/g, '-')
    .replace(/\..+/, '')
    .replace('T', '_');

  const rolesFile = path.join(backupsDir, `backup_${timestamp}_roles.sql`);
  const schemaFile = path.join(backupsDir, `backup_${timestamp}_schema.sql`);
  const dataFile = path.join(backupsDir, `backup_${timestamp}_data.sql`);

  try {
    // Dump roles
    console.log('📋 Dumping roles...');
    await execAsync(
      `supabase db dump --db-url "${connectionString}" -f "${rolesFile}" --role-only`,
      { maxBuffer: 10 * 1024 * 1024 }
    );
    console.log(`✅ Roles saved to: ${rolesFile}`);

    // Dump schema
    console.log('\n📋 Dumping schema...');
    await execAsync(
      `supabase db dump --db-url "${connectionString}" -f "${schemaFile}"`,
      { maxBuffer: 50 * 1024 * 1024 }
    );
    console.log(`✅ Schema saved to: ${schemaFile}`);

    // Dump data
    console.log('\n📋 Dumping data...');
    await execAsync(
      `supabase db dump --db-url "${connectionString}" -f "${dataFile}" --use-copy --data-only`,
      { maxBuffer: 50 * 1024 * 1024 }
    );
    console.log(`✅ Data saved to: ${dataFile}`);

    return {
      roles: rolesFile,
      schema: schemaFile,
      data: dataFile
    };
  } catch (error) {
    if (error.message.includes('supabase') || error.code === 'ENOENT') {
      throw new Error('Supabase CLI not found. Install it with: npm install -g supabase');
    }
    throw error;
  }
}

/**
 * Fallback method using Node.js pg library
 * Only used when pg_dump is not available
 */
async function backupUsingNode(connectionString, outputPath) {
  console.log('📦 Using Node.js pg library for backup (fallback method)...\n');
  
  let pg;
  try {
    pg = require('pg');
  } catch (e) {
    throw new Error('pg library not found. Install it with: npm install pg --save-dev');
  }

  const client = new pg.Client({
    connectionString: connectionString,
    ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: 30000
  });

  try {
    await client.connect();
    console.log('✅ Connected to database\n');

    const tablesResult = await client.query(`
      SELECT tablename 
      FROM pg_tables 
      WHERE schemaname = 'public'
      ORDER BY tablename;
    `);

    const tables = tablesResult.rows.map(row => row.tablename);
    console.log(`📊 Found ${tables.length} tables to backup\n`);

    let backupContent = '-- Database Backup\n';
    backupContent += `-- Generated: ${new Date().toISOString()}\n`;
    backupContent += `-- Database: ${client.database}\n`;
    backupContent += `-- WARNING: This is a fallback backup. Use pg_dump for production backups.\n\n`;
    backupContent += 'BEGIN;\n\n';

    for (const table of tables) {
      console.log(`📄 Backing up table: ${table}`);
      
      const schemaResult = await client.query(`
        SELECT 
          'CREATE TABLE IF NOT EXISTS ' || quote_ident(table_name) || ' (' ||
          string_agg(
            quote_ident(column_name) || ' ' || 
            CASE 
              WHEN data_type = 'USER-DEFINED' THEN udt_name
              WHEN data_type = 'ARRAY' THEN udt_name || '[]'
              ELSE 
                CASE 
                  WHEN character_maximum_length IS NOT NULL 
                  THEN data_type || '(' || character_maximum_length || ')'
                  WHEN numeric_precision IS NOT NULL AND numeric_scale IS NOT NULL
                  THEN data_type || '(' || numeric_precision || ',' || numeric_scale || ')'
                  WHEN numeric_precision IS NOT NULL
                  THEN data_type || '(' || numeric_precision || ')'
                  ELSE data_type
                END
            END ||
            CASE WHEN is_nullable = 'NO' THEN ' NOT NULL' ELSE '' END ||
            CASE WHEN column_default IS NOT NULL THEN ' DEFAULT ' || column_default ELSE '' END,
            ', '
          ) || ');' as create_statement
        FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = $1
        GROUP BY table_name;
      `, [table]);

      if (schemaResult.rows.length > 0) {
        backupContent += `-- Table: ${table}\n`;
        backupContent += `DROP TABLE IF EXISTS ${table} CASCADE;\n`;
        backupContent += schemaResult.rows[0].create_statement + '\n\n';
      }

      const dataResult = await client.query(`SELECT * FROM ${table}`);
      
      if (dataResult.rows.length > 0) {
        for (const row of dataResult.rows) {
          const columns = Object.keys(row).map(col => `"${col.replace(/"/g, '""')}"`).join(', ');
          const values = Object.values(row).map(val => {
            if (val === null) return 'NULL';
            if (typeof val === 'string') {
              return `'${val.replace(/\\/g, '\\\\').replace(/'/g, "''")}'`;
            }
            if (val instanceof Date) return `'${val.toISOString()}'`;
            if (Buffer.isBuffer(val)) return `'\\x${val.toString('hex')}'`;
            if (typeof val === 'object') {
              const jsonStr = JSON.stringify(val);
              return `'${jsonStr.replace(/\\/g, '\\\\').replace(/'/g, "''")}'`;
            }
            if (typeof val === 'boolean') return val ? 'TRUE' : 'FALSE';
            return val;
          }).join(', ');
          backupContent += `INSERT INTO ${table} (${columns}) VALUES (${values});\n`;
        }
        backupContent += '\n';
      }
    }

    backupContent += 'COMMIT;\n';
    fs.writeFileSync(outputPath, backupContent, 'utf8');
    console.log(`\n✅ Backup written to: ${outputPath}`);

    return true;
  } finally {
    await client.end();
  }
}

async function main() {
  console.log('🚀 Starting professional database backup...\n');
  console.log(`📍 Supabase URL: ${SUPABASE_URL}`);
  console.log(`📦 Backup format: ${BACKUP_FORMAT}\n`);

  try {
    const connectionString = getConnectionString();
    const backupsDir = await createBackupDirectory();

    let success = false;
    let backupFiles = [];

    // Try professional methods first
    if (BACKUP_FORMAT === 'supabase-cli') {
      try {
        const files = await backupUsingSupabaseCLI(connectionString, backupsDir);
        backupFiles = Object.values(files);
        success = true;
      } catch (error) {
        console.log(`\n⚠️  Supabase CLI backup failed: ${error.message}`);
        console.log('💡 Falling back to pg_dump...\n');
        // Fall through to pg_dump
      }
    }

    if (!success && BACKUP_FORMAT === 'custom') {
      try {
        const filename = getBackupFilename('custom');
        const outputPath = path.join(backupsDir, filename);
        await backupUsingPgDumpCustom(connectionString, outputPath);
        backupFiles = [outputPath];
        success = true;
      } catch (error) {
        if (error.isPgDumpMissing || error.message.includes('pg_dump') || error.code === 'ENOENT' || 
            (error.message && error.message.includes('not recognized'))) {
          console.log('⚠️  pg_dump not found, trying plain SQL format...\n');
          // Try plain format
          try {
            const filename = getBackupFilename('plain');
            const outputPath = path.join(backupsDir, filename);
            await backupUsingPgDumpPlain(connectionString, outputPath);
            backupFiles = [outputPath];
            success = true;
          } catch (plainError) {
            if (plainError.isPgDumpMissing || plainError.message.includes('pg_dump') || plainError.code === 'ENOENT' ||
                (plainError.message && plainError.message.includes('not recognized'))) {
              console.log('⚠️  pg_dump not available, falling back to Node.js method...\n');
              const filename = getBackupFilename('plain');
              const outputPath = path.join(backupsDir, filename);
              await backupUsingNode(connectionString, outputPath);
              backupFiles = [outputPath];
              success = true;
            } else {
              throw plainError;
            }
          }
        } else {
          throw error;
        }
      }
    } else if (!success && BACKUP_FORMAT === 'plain') {
      try {
        const filename = getBackupFilename('plain');
        const outputPath = path.join(backupsDir, filename);
        await backupUsingPgDumpPlain(connectionString, outputPath);
        backupFiles = [outputPath];
        success = true;
      } catch (error) {
        if (error.isPgDumpMissing || error.message.includes('pg_dump') || error.code === 'ENOENT' ||
            (error.message && error.message.includes('not recognized'))) {
          console.log('⚠️  pg_dump not available, falling back to Node.js method...\n');
          const filename = getBackupFilename('plain');
          const outputPath = path.join(backupsDir, filename);
          await backupUsingNode(connectionString, outputPath);
          backupFiles = [outputPath];
          success = true;
        } else {
          throw error;
        }
      }
    }

    // Final fallback to Node.js if all else fails
    if (!success) {
      console.log('⚠️  Professional methods unavailable, using Node.js fallback...\n');
      const filename = getBackupFilename('plain');
      const outputPath = path.join(backupsDir, filename);
      await backupUsingNode(connectionString, outputPath);
      backupFiles = [outputPath];
      success = true;
    }

    if (success) {
      console.log('\n' + '='.repeat(60));
      console.log('✅ Backup completed successfully!');
      console.log('='.repeat(60));
      
      let totalSize = 0;
      backupFiles.forEach(file => {
        const stats = fs.statSync(file);
        const fileSizeMB = (stats.size / (1024 * 1024)).toFixed(2);
        totalSize += stats.size;
        console.log(`📁 ${path.basename(file)}: ${fileSizeMB} MB`);
      });
      
      const totalSizeMB = (totalSize / (1024 * 1024)).toFixed(2);
      console.log(`\n📊 Total size: ${totalSizeMB} MB`);
      
      if (BACKUP_FORMAT === 'custom' && backupFiles[0].endsWith('.dump')) {
        console.log(`\n💡 To restore this backup, use:`);
        console.log(`   pg_restore -h <host> -U <user> -d <database> -c ${backupFiles[0]}`);
        console.log(`\n   Or for selective restore:`);
        console.log(`   pg_restore -h <host> -U <user> -d <database> -t <table_name> ${backupFiles[0]}`);
      } else if (BACKUP_FORMAT === 'supabase-cli') {
        console.log(`\n💡 To restore these backups:`);
        console.log(`   1. Restore roles: psql <connection> -f ${backupFiles.find(f => f.includes('_roles'))}`);
        console.log(`   2. Restore schema: psql <connection> -f ${backupFiles.find(f => f.includes('_schema'))}`);
        console.log(`   3. Restore data: psql <connection> -f ${backupFiles.find(f => f.includes('_data'))}`);
      } else {
        console.log(`\n💡 To restore this backup, use:`);
        console.log(`   psql <connection> -f ${backupFiles[0]}`);
      }
    }
  } catch (error) {
    console.error('\n❌ Backup failed:', error.message);
    if (error.stderr) {
      console.error('Error details:', error.stderr);
    }
    
    // Provide helpful installation instructions for Windows
    if (error.message && error.message.includes('not recognized')) {
      console.error('\n' + '='.repeat(60));
      console.error('💡 To use professional backup methods, install PostgreSQL client tools:');
      console.error('='.repeat(60));
      console.error('\n📥 Windows Installation Options:');
      console.error('\n   1. Using Chocolatey (recommended):');
      console.error('      choco install postgresql');
      console.error('\n   2. Using Winget:');
      console.error('      winget install PostgreSQL.PostgreSQL');
      console.error('\n   3. Manual Download:');
      console.error('      https://www.postgresql.org/download/windows/');
      console.error('      Download and install PostgreSQL (includes pg_dump)');
      console.error('\n   4. Or use the Node.js fallback (already working):');
      console.error('      The script will automatically use Node.js if pg_dump is not available');
      console.error('\n   After installation, restart your terminal and try again.');
      console.error('='.repeat(60));
    }
    
    process.exit(1);
  }
}

main();
