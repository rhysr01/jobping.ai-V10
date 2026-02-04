#!/usr/bin/env node
/**
 * Fix Missing Job Hashes - Database Migration Script
 * 
 * Problem: 69% of jobs (27,905 out of 40,455) are missing job_hash values
 * This causes free signup matching to fail with "No jobs found for hashes: null, null, null"
 * 
 * Solution: Generate unique job_hash values for all jobs missing them
 * Uses job ID + content to ensure uniqueness and avoid duplicates
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function fixMissingJobHashes() {
  console.log('🔍 Checking for jobs without job_hash...');
  
  // Get count of jobs without hash
  const { data: stats, error: statsError } = await supabase
    .from('jobs')
    .select('id', { count: 'exact', head: true })
    .is('job_hash', null)
    .eq('is_active', true)
    .eq('status', 'active');
    
  if (statsError) {
    console.error('❌ Error checking stats:', statsError);
    return;
  }
    
  const totalToFix = stats || 0;
  console.log(`📊 Found ${totalToFix} jobs without job_hash`);
  
  if (totalToFix === 0) {
    console.log('✅ All jobs already have job_hash values');
    return;
  }
  
  // Process in batches of 100 to avoid timeouts
  const batchSize = 100;
  let processed = 0;
  let errors = 0;
  
  console.log(`🔧 Processing ${totalToFix} jobs in batches of ${batchSize}...`);
  
  while (processed < totalToFix) {
    try {
      // Get next batch of jobs without hash
      const { data: jobsToFix, error: fetchError } = await supabase
        .from('jobs')
        .select('id, title, company, location, source')
        .is('job_hash', null)
        .eq('is_active', true)
        .eq('status', 'active')
        .limit(batchSize);
        
      if (fetchError) {
        console.error('❌ Error fetching jobs:', fetchError);
        break;
      }
      
      if (!jobsToFix || jobsToFix.length === 0) {
        console.log('✅ No more jobs to process');
        break;
      }
      
      console.log(`📝 Processing batch: ${processed + 1}-${processed + jobsToFix.length} of ${totalToFix}`);
      
      // Generate job_hash for each job
      const updates = jobsToFix.map(job => {
        const crypto = require('crypto');
        const content = `${job.id}|${job.title || ''}|${job.company || ''}|${job.location || ''}`;
        const job_hash = crypto.createHash('sha256').update(content).digest('hex');
        
        return {
          id: job.id,
          job_hash: job_hash
        };
      });
      
      // Update jobs with new hashes
      const { error: updateError } = await supabase
        .from('jobs')
        .upsert(updates, { onConflict: 'id' });
        
      if (updateError) {
        console.error('❌ Error updating batch:', updateError);
        errors += jobsToFix.length;
      } else {
        console.log(`✅ Updated ${jobsToFix.length} jobs with job_hash`);
      }
      
      processed += jobsToFix.length;
      
      // Small delay to avoid overwhelming the database
      await new Promise(resolve => setTimeout(resolve, 100));
      
    } catch (error) {
      console.error('❌ Batch processing error:', error);
      errors++;
      break;
    }
  }
  
  console.log('\n📊 Migration Summary:');
  console.log(`✅ Successfully processed: ${processed - errors} jobs`);
  console.log(`❌ Errors: ${errors} jobs`);
  console.log(`📈 Success rate: ${Math.round(((processed - errors) / processed) * 100)}%`);
  
  // Verify the fix
  const { data: finalStats } = await supabase
    .from('jobs')
    .select('id', { count: 'exact', head: true })
    .is('job_hash', null)
    .eq('is_active', true)
    .eq('status', 'active');
    
  const remaining = finalStats || 0;
  console.log(`\n🎯 Remaining jobs without hash: ${remaining}`);
  
  if (remaining === 0) {
    console.log('🎉 SUCCESS: All active jobs now have job_hash values!');
    console.log('🚀 Free signup matching should now work correctly');
  } else {
    console.log(`⚠️  ${remaining} jobs still need fixing`);
  }
}

// Run the migration
fixMissingJobHashes()
  .then(() => {
    console.log('\n✅ Migration completed');
    process.exit(0);
  })
  .catch(error => {
    console.error('\n❌ Migration failed:', error);
    process.exit(1);
  });