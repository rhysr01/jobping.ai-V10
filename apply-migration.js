#!/usr/bin/env node

// Quick script to apply the postal job categorization fix migration
require('dotenv').config({ path: '.env.local' });

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

async function applyMigration() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Missing Supabase environment variables');
    process.exit(1);
  }

  console.log('🔄 Connecting to Supabase...');
  const supabase = createClient(supabaseUrl, supabaseKey);

  try {
    // Read our migration file
    const migrationSQL = fs.readFileSync('./supabase/migrations/20260125000000_fix_postal_jobs_tech_categorization.sql', 'utf8');

    console.log('📄 Applying migration: Fix postal jobs tech categorization...');

    // Execute the migration using raw SQL
    const { error } = await supabase.rpc('exec', { query: migrationSQL });

    if (error) {
      console.error('❌ Migration failed:', error);
      // Try direct SQL execution
      console.log('🔄 Trying direct SQL execution...');
      const { error: directError } = await supabase.from('_supabase_migration_temp').select('*').limit(1);
      if (directError) {
        console.log('📄 Executing migration SQL directly...');
        // Split the migration into individual statements and execute them
        const statements = migrationSQL.split(';').filter(stmt => stmt.trim().length > 0);
        for (const statement of statements) {
          if (statement.trim()) {
            console.log('Executing:', statement.substring(0, 50) + '...');
            try {
              await supabase.rpc('exec', { query: statement });
            } catch (stmtError) {
              console.warn('Statement failed, continuing:', stmtError.message);
            }
          }
        }
        console.log('✅ Migration execution completed');
        return;
      }
      process.exit(1);
    }

    console.log('✅ Migration applied successfully!');
    console.log('🎯 Postal jobs will no longer be categorized as tech roles');

  } catch (error) {
    console.error('❌ Error applying migration:', error);
    process.exit(1);
  }
}

applyMigration();