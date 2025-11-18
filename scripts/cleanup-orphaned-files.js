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
  console.log('🧹 Starting cleanup of orphaned files and records...\n');

  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  const stats = {
    storageFiles: { total: 0, orphaned: 0, deleted: 0, failed: 0 },
    codeFiles: { orphaned: 0, deleted: 0, failed: 0 },
    attachments: { orphaned: 0, deleted: 0, failed: 0 }
  };

  // ============================================
  // PART 1: Clean orphaned storage files
  // ============================================
  console.log('📦 PART 1: Cleaning orphaned storage files...\n');

  async function listAllFiles(path = '', files = []) {
    const { data, error } = await supabase.storage
      .from('submission-attachments')
      .list(path, { limit: 1000 });
    
    if (error || !data) return files;
    
    for (const item of data) {
      const fullPath = path ? `${path}/${item.name}` : item.name;
      if (item.id) {
        files.push(fullPath);
      } else {
        await listAllFiles(fullPath, files);
      }
    }
    return files;
  }
  
  const storageFiles = await listAllFiles();
  stats.storageFiles.total = storageFiles.length;
  console.log(`   Found ${storageFiles.length} files in storage`);

  const { data: dbAttachments } = await supabase
    .from('submission_attachments')
    .select('storage_path');
  
  const dbPaths = new Set((dbAttachments || []).map(a => a.storage_path));
  console.log(`   Found ${dbPaths.size} records in database`);

  const orphanedFiles = storageFiles.filter(file => !dbPaths.has(file));
  stats.storageFiles.orphaned = orphanedFiles.length;
  console.log(`   Found ${orphanedFiles.length} orphaned storage files`);

  if (orphanedFiles.length > 0) {
    console.log('   Deleting orphaned storage files...');
    for (const filePath of orphanedFiles) {
      const { error } = await supabase.rpc('delete_storage_file', {
        bucket_name: 'submission-attachments',
        file_path: filePath
      });
      
      if (error) {
        stats.storageFiles.failed++;
      } else {
        stats.storageFiles.deleted++;
      }
    }
  }

  // ============================================
  // PART 2: Clean orphaned submission_code records
  // ============================================
  console.log('\n📝 PART 2: Cleaning orphaned submission_code records...\n');

  // Get all valid submission IDs first
  const { data: validSubmissions } = await supabase
    .from('submissions')
    .select('id');
  
  const validSubmissionIds = new Set((validSubmissions || []).map(s => s.id));
  console.log(`   Found ${validSubmissionIds.size} valid submissions`);

  // Get all code files and check which are orphaned
  const { data: allCodeFiles } = await supabase
    .from('submission_code')
    .select('id, submission_id');

  const orphanedCode = (allCodeFiles || []).filter(cf => !validSubmissionIds.has(cf.submission_id));
  stats.codeFiles.orphaned = orphanedCode.length;
  console.log(`   Found ${orphanedCode.length} orphaned code file records`);

  if (orphanedCode.length > 0) {
    console.log('   Deleting orphaned code file records...');
    const codeIds = orphanedCode.map(cf => cf.id);
    
    // Delete in batches of 100
    for (let i = 0; i < codeIds.length; i += 100) {
      const batch = codeIds.slice(i, i + 100);
      const { error } = await supabase
        .from('submission_code')
        .delete()
        .in('id', batch);
      
      if (error) {
        stats.codeFiles.failed += batch.length;
        console.error(`   ❌ Failed to delete batch:`, error.message);
      } else {
        stats.codeFiles.deleted += batch.length;
        if (stats.codeFiles.deleted % 50 === 0) {
          console.log(`   ✅ Deleted ${stats.codeFiles.deleted}/${orphanedCode.length} code files...`);
        }
      }
    }
  }

  // ============================================
  // PART 3: Clean orphaned submission_attachments records
  // ============================================
  console.log('\n📎 PART 3: Cleaning orphaned submission_attachments records...\n');

  const { data: allAttachments } = await supabase
    .from('submission_attachments')
    .select('id, submission_id, storage_path');

  const orphanedAttachments = (allAttachments || []).filter(
    att => !validSubmissionIds.has(att.submission_id)
  );
  stats.attachments.orphaned = orphanedAttachments.length;
  console.log(`   Found ${orphanedAttachments.length} orphaned attachment records`);

  if (orphanedAttachments.length > 0) {
    console.log('   Deleting orphaned attachment records and their storage files...');
    
    for (let i = 0; i < orphanedAttachments.length; i++) {
      const attachment = orphanedAttachments[i];
      
      // Delete from storage first
      if (attachment.storage_path) {
        await supabase.rpc('delete_storage_file', {
          bucket_name: 'submission-attachments',
          file_path: attachment.storage_path
        });
      }
      
      // Delete database record
      const { error } = await supabase
        .from('submission_attachments')
        .delete()
        .eq('id', attachment.id);
      
      if (error) {
        stats.attachments.failed++;
      } else {
        stats.attachments.deleted++;
        if (stats.attachments.deleted % 10 === 0) {
          console.log(`   ✅ Deleted ${stats.attachments.deleted}/${orphanedAttachments.length} attachments...`);
        }
      }
    }
  }

  // ============================================
  // SUMMARY
  // ============================================
  console.log('\n📊 Cleanup Summary:');
  console.log('\n   Storage Files:');
  console.log(`     Total files: ${stats.storageFiles.total}`);
  console.log(`     Orphaned: ${stats.storageFiles.orphaned}`);
  console.log(`     Deleted: ${stats.storageFiles.deleted}`);
  console.log(`     Failed: ${stats.storageFiles.failed}`);
  
  console.log('\n   Database Records:');
  console.log(`     Orphaned code files: ${stats.codeFiles.orphaned}`);
  console.log(`     Deleted code files: ${stats.codeFiles.deleted}`);
  console.log(`     Failed code files: ${stats.codeFiles.failed}`);
  console.log(`     Orphaned attachments: ${stats.attachments.orphaned}`);
  console.log(`     Deleted attachments: ${stats.attachments.deleted}`);
  console.log(`     Failed attachments: ${stats.attachments.failed}`);

  const totalOrphaned = stats.storageFiles.orphaned + stats.codeFiles.orphaned + stats.attachments.orphaned;
  const totalDeleted = stats.storageFiles.deleted + stats.codeFiles.deleted + stats.attachments.deleted;

  if (totalOrphaned === 0) {
    console.log('\n✅ No orphaned files or records found! Everything is clean.');
  } else {
    console.log(`\n✅ Cleanup complete! Deleted ${totalDeleted} orphaned items.`);
  }
}

cleanupOrphanedFiles().catch(console.error);

