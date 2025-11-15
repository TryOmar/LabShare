const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const SUPABASE_ACCESS_TOKEN = process.env.SUPABASE_ACCESS_TOKEN;
const DATABASE_PASSWORD = process.env.DATABASE_PASSWORD;
const DATABASE_URL = process.env.DATABASE_URL; // Direct connection string (optional, overrides auto-generated)

if (!SUPABASE_URL) {
  console.error('❌ Missing NEXT_PUBLIC_SUPABASE_URL in .env.local');
  process.exit(1);
}

// Try to use pg library if available
let pg;
try {
  pg = require('pg');
} catch (e) {
  console.log('⚠️  pg library not found.');
  console.log('💡 Installing pg library...\n');
  console.log('   Run: npm install pg --save-dev\n');
  console.log('📋 Or use the Supabase Dashboard SQL Editor (easiest method):');
  console.log('   1. Go to https://supabase.com/dashboard');
  console.log('   2. Select your project');
  console.log('   3. Go to SQL Editor');
  console.log('   4. Copy and paste the contents of your SQL files\n');
  process.exit(1);
}

function getConnectionStrings() {
  // If DATABASE_URL is provided directly, use it (highest priority)
  if (DATABASE_URL) {
    console.log('📌 Using DATABASE_URL from environment\n');
    return [DATABASE_URL];
  }

  // Extract project reference from Supabase URL
  const projectRef = SUPABASE_URL.match(/https:\/\/([^.]+)\.supabase\.co/)?.[1];
  if (!projectRef) {
    throw new Error('Could not extract project reference from SUPABASE_URL');
  }

  // Use DATABASE_PASSWORD if provided, otherwise prompt
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
  
  const connectionStrings = [];
  
  // Try session pooler for eu-north-1 first (most common for projects without public IPv4)
  // Session mode uses port 6543, transaction mode uses 5432
  connectionStrings.push(
    `postgresql://postgres.${projectRef}:${encodedPassword}@aws-1-eu-north-1.pooler.supabase.com:6543/postgres`
  );
  connectionStrings.push(
    `postgresql://postgres.${projectRef}:${encodedPassword}@aws-0-eu-north-1.pooler.supabase.com:6543/postgres`
  );
  
  // Try transaction mode pooler for eu-north-1
  connectionStrings.push(
    `postgresql://postgres.${projectRef}:${encodedPassword}@aws-1-eu-north-1.pooler.supabase.com:5432/postgres`
  );
  connectionStrings.push(
    `postgresql://postgres.${projectRef}:${encodedPassword}@aws-0-eu-north-1.pooler.supabase.com:5432/postgres`
  );
  
  // Try other common regions as fallback
  const otherRegions = ['us-east-1', 'us-west-1', 'eu-west-1', 'ap-southeast-1'];
  for (const region of otherRegions) {
    connectionStrings.push(
      `postgresql://postgres.${projectRef}:${encodedPassword}@aws-0-${region}.pooler.supabase.com:6543/postgres`
    );
    connectionStrings.push(
      `postgresql://postgres.${projectRef}:${encodedPassword}@aws-0-${region}.pooler.supabase.com:5432/postgres`
    );
  }
  
  return connectionStrings;
}

async function runSQLFile(filePath, client) {
  console.log(`\n📄 Reading: ${path.basename(filePath)}`);
  const sql = fs.readFileSync(filePath, 'utf8');
  
  console.log(`🚀 Executing SQL from ${path.basename(filePath)}...`);
  
  try {
    // Execute the SQL file
    await client.query(sql);
    console.log(`✅ Successfully executed ${path.basename(filePath)}`);
  } catch (error) {
    console.error(`❌ Error executing ${path.basename(filePath)}:`, error.message);
    throw error;
  }
}

async function tryConnect(connectionString, attempt) {
  const client = new pg.Client({
    connectionString: connectionString,
    ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: 10000
  });

  try {
    await client.connect();
    return client;
  } catch (error) {
    if (attempt < 2) {
      console.log(`⚠️  Connection attempt ${attempt + 1} failed, trying next method...`);
    }
    throw error;
  }
}

async function main() {
  console.log('🚀 Starting database migration...\n');
  console.log(`📍 Supabase URL: ${SUPABASE_URL}\n`);

  const connectionStrings = getConnectionStrings();
  const scriptsDir = path.join(__dirname);
  const schemaFile = path.join(scriptsDir, '001_create_schema.sql');
  const seedFile = path.join(scriptsDir, '002_seed_data.sql');

  let client = null;
  let connected = false;

  // Try each connection method
  for (let i = 0; i < connectionStrings.length; i++) {
    try {
      console.log(`🔌 Attempting connection (method ${i + 1}/${connectionStrings.length})...`);
      client = await tryConnect(connectionStrings[i], i);
      console.log('✅ Connected to database\n');
      connected = true;
      break;
    } catch (error) {
      if (i === connectionStrings.length - 1) {
        // Last attempt failed
        console.error('\n❌ All connection attempts failed');
        console.error('Last error:', error.message);
        console.error('\n📋 Connection strings tried:');
        connectionStrings.forEach((conn, idx) => {
          // Mask password in output
          const masked = conn.replace(/:([^:@]+)@/, ':***@');
          console.error(`   ${idx + 1}. ${masked}`);
        });
        console.error('\n💡 Solution: Get the exact connection string from Supabase Dashboard');
        console.error('   1. Go to https://supabase.com/dashboard');
        console.error('   2. Select your project');
        console.error('   3. Go to Settings → Database');
        console.error('   4. Scroll to "Connection string" section');
        console.error('   5. Copy the "URI" or "Connection pooling" connection string');
        console.error('   6. Add it to .env.local as:');
        console.error('      DATABASE_URL=postgresql://...');
        console.error('\n💡 Alternative: Use the Supabase Dashboard SQL Editor (easiest):');
        console.error('   1. Go to https://supabase.com/dashboard');
        console.error('   2. Select your project');
        console.error('   3. Go to SQL Editor');
        console.error('   4. Copy and paste the contents of:');
        console.error(`      - ${path.join(__dirname, '001_create_schema.sql')}`);
        console.error(`      - ${path.join(__dirname, '002_seed_data.sql')}`);
        process.exit(1);
      }
    }
  }

  try {
    // Run schema first
    if (fs.existsSync(schemaFile)) {
      await runSQLFile(schemaFile, client);
    } else {
      console.error(`❌ Schema file not found: ${schemaFile}`);
      process.exit(1);
    }

    // Then run seed data
    if (fs.existsSync(seedFile)) {
      await runSQLFile(seedFile, client);
    } else {
      console.error(`❌ Seed file not found: ${seedFile}`);
      process.exit(1);
    }

    console.log('\n✅ Migration completed successfully!');
  } catch (error) {
    console.error('\n❌ Migration failed:', error.message);
    console.error('\n💡 Alternative: Use the Supabase Dashboard SQL Editor:');
    console.error('   1. Go to https://supabase.com/dashboard');
    console.error('   2. Select your project');
    console.error('   3. Go to SQL Editor');
    console.error('   4. Copy and paste the contents of your SQL files');
    process.exit(1);
  } finally {
    if (client) {
      await client.end();
    }
  }
}

main();

