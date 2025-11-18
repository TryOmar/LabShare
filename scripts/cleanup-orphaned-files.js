/**
 * Cleanup script to remove orphaned files from storage
 * Files that exist in storage but don't have records in submission_attachments table
 */

require('dotenv').config({ path: require('path').join(__dirname, '..', '.env.local') });
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

async function cleanupOrphanedFiles() {
  console.log('🧹 Starting cleanup of orphaned storage files...\n');

  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

  // Step 1: Get all files from storage
  console.log('📋 Step 1: Listing all files in storage...');
  const allStorageFiles = [];
  
  async function listAllFiles(path = '', files = []) {
    const { data, error } = await supabase.storage
      .from('submission-attachments')
      .list(path, { limit: 1000 });
    
    if (error) {
      console.error(`Error listing ${path}:`, error.message);
      return files;
    }
    
    if (!data) return files;
    
    for (const item of data) {
      const fullPath = path ? `${path}/${item.name}` : item.name;
      
      if (item.id) {
        // It's a file
        files.push(fullPath);
      } else {
        // It's a folder, recurse
        await listAllFiles(fullPath, files);
      }
    }
    
    return files;
  }
  
  const storageFiles = await listAllFiles();
  console.log(`   Found ${storageFiles.length} files in storage`);

  // Step 2: Get all storage paths from database
  console.log('\n📋 Step 2: Getting all storage paths from database...');
  const { data: dbAttachments, error: dbError } = await supabase
    .from('submission_attachments')
    .select('storage_path');
  
  if (dbError) {
    console.error('Error fetching database records:', dbError);
    process.exit(1);
  }
  
  const dbPaths = new Set((dbAttachments || []).map(a => a.storage_path));
  console.log(`   Found ${dbPaths.size} records in database`);

  // Step 3: Find orphaned files
  console.log('\n🔍 Step 3: Finding orphaned files...');
  const orphanedFiles = storageFiles.filter(file => !dbPaths.has(file));
  console.log(`   Found ${orphanedFiles.length} orphaned files`);
  
  if (orphanedFiles.length === 0) {
    console.log('\n✅ No orphaned files found! Storage is clean.');
    return;
  }

  // Step 4: Delete orphaned files
  console.log('\n🗑️  Step 4: Deleting orphaned files...');
  console.log('   Orphaned files:');
  orphanedFiles.slice(0, 10).forEach(file => console.log(`     - ${file}`));
  if (orphanedFiles.length > 10) {
    console.log(`     ... and ${orphanedFiles.length - 10} more`);
  }

  let deletedCount = 0;
  let failedCount = 0;

  for (const filePath of orphanedFiles) {
    const { error } = await supabase.rpc('delete_storage_file', {
      bucket_name: 'submission-attachments',
      file_path: filePath
    });
    
    if (error) {
      console.error(`   ❌ Failed to delete ${filePath}:`, error.message);
      failedCount++;
    } else {
      deletedCount++;
      if (deletedCount % 10 === 0) {
        console.log(`   ✅ Deleted ${deletedCount}/${orphanedFiles.length} files...`);
      }
    }
  }

  console.log(`\n📊 Cleanup Summary:`);
  console.log(`   Total orphaned files: ${orphanedFiles.length}`);
  console.log(`   Successfully deleted: ${deletedCount}`);
  console.log(`   Failed to delete: ${failedCount}`);
  console.log(`\n✅ Cleanup complete!`);
}

cleanupOrphanedFiles().catch(console.error);

