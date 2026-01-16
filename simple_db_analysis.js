require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function simpleAnalysis() {
  console.log('🔍 DATABASE ANALYSIS - ADDITIONAL ISSUES');
  console.log('========================================\n');

  // ============================================================================
  // 1. CHECK CURRENT FILTERING STATUS
  // ============================================================================

  console.log('📊 CURRENT FILTER STATUS:');
  console.log('------------------------');

  try {
    const { data: filteredStats, error } = await supabase
      .from('jobs')
      .select('filtered_reason')
      .not('filtered_reason', 'is', null)
      .limit(1000);

    if (filteredStats) {
      const reasons = {};
      filteredStats.forEach(job => {
        if (job.filtered_reason) {
          const reasonList = job.filtered_reason.split(';');
          reasonList.forEach(reason => {
            const cleanReason = reason.trim();
            if (cleanReason) {
              reasons[cleanReason] = (reasons[cleanReason] || 0) + 1;
            }
          });
        }
      });

      console.log('Current filtering reasons:');
      Object.entries(reasons)
        .sort(([,a], [,b]) => b - a)
        .forEach(([reason, count]) => {
          console.log(`  ${reason}: ${count} jobs`);
        });
    }
  } catch (e) {
    console.log('Could not access filtered job data (RLS restrictions)');
  }

  // ============================================================================
  // 2. IDENTIFY ADDITIONAL IRRELEVANT ROLES
  // ============================================================================

  console.log('\n🎯 POTENTIAL ADDITIONAL FILTERS NEEDED:');
  console.log('--------------------------------------');

  const potentialFilters = [
    // Government/Politics
    { pattern: '%politician%', desc: 'Politicians and political roles' },
    { pattern: '%government%', desc: 'Government administration roles' },
    { pattern: '%minister%', desc: 'Government ministers' },
    { pattern: '%diplomat%', desc: 'Diplomatic roles' },

    // Military/Security
    { pattern: '%military%', desc: 'Military roles' },
    { pattern: '%armed forces%', desc: 'Armed forces positions' },
    { pattern: '%security guard%', desc: 'Security guard roles' },

    // Entertainment/Sports
    { pattern: '%athlete%', desc: 'Professional athletes' },
    { pattern: '%actor%', desc: 'Acting/entertainment roles' },
    { pattern: '%musician%', desc: 'Music/entertainment roles' },
    { pattern: '%fitness trainer%', desc: 'Fitness/gym trainer roles' },

    // Hospitality/Service Industry
    { pattern: '%waiter%', desc: 'Restaurant service staff' },
    { pattern: '%bartender%', desc: 'Bar/restaurant staff' },
    { pattern: '%hotel%', desc: 'Hotel staff' },
    { pattern: '%tour guide%', desc: 'Tourism roles' },

    // Retail/Trade
    { pattern: '%cashier%', desc: 'Retail cashier roles' },
    { pattern: '%sales assistant%', desc: 'Retail sales assistants' },
    { pattern: '%shop assistant%', desc: 'Shop assistant roles' },

    // Manual/Technical (Non-IT)
    { pattern: '%mechanic%', desc: 'Automotive mechanics' },
    { pattern: '%electrician%', desc: 'Electrical technicians' },
    { pattern: '%plumber%', desc: 'Plumbing technicians' },
    { pattern: '%driver%', desc: 'Professional drivers' },

    // Sales/Telemarketing
    { pattern: '%telemarketer%', desc: 'Telemarketing roles' },
    { pattern: '%call center%', desc: 'Call center agents' },
    { pattern: '%door to door%', desc: 'Door-to-door sales' },

    // Other Non-Business
    { pattern: '%real estate agent%', desc: 'Real estate agents' },
    { pattern: '%insurance agent%', desc: 'Insurance sales agents' },
    { pattern: '%loan officer%', desc: 'Loan officers (non-business)' },
    { pattern: '%mortgage%', desc: 'Mortgage brokers' },
  ];

  console.log('Additional role categories to consider filtering:');
  potentialFilters.forEach(({ desc }) => {
    console.log(`• ${desc}`);
  });

  // ============================================================================
  // 3. METADATA AND DATA QUALITY ISSUES
  // ============================================================================

  console.log('\n🔧 METADATA ISSUES TO ADDRESS:');
  console.log('------------------------------');

  const metadataIssues = [
    'Jobs with missing or empty titles',
    'Jobs with missing company names',
    'Jobs with generic company names ("Company", "Ltd", etc.)',
    'Jobs with missing or invalid locations',
    'Jobs with placeholder or test descriptions',
    'Jobs with unrealistic salary expectations',
    'Jobs posted by job boards as "companies"',
    'Duplicate job postings with slight variations',
    'Jobs requiring specific tools/software not mentioned',
    'Jobs with inconsistent date formats',
    'Jobs with foreign language content in English searches',
  ];

  metadataIssues.forEach(issue => {
    console.log(`• ${issue}`);
  });

  // ============================================================================
  // 4. BUSINESS LOGIC IMPROVEMENTS
  // ============================================================================

  console.log('\n🎯 BUSINESS LOGIC ENHANCEMENTS:');
  console.log('------------------------------');

  const businessImprovements = [
    'Better detection of graduate vs experienced roles',
    'Improved identification of visa sponsor jobs',
    'Enhanced remote work classification',
    'Better categorization of job types (technical vs business)',
    'Improved salary range parsing and normalization',
    'Enhanced company size detection',
    'Better work environment classification',
    'Improved skill requirement extraction',
    'Enhanced location proximity matching',
    'Better handling of international job postings',
  ];

  businessImprovements.forEach(improvement => {
    console.log(`• ${improvement}`);
  });

  // ============================================================================
  // 5. RECOMMENDED ADDITIONAL MIGRATION
  // ============================================================================

  console.log('\n📋 RECOMMENDED ADDITIONAL MIGRATION:');
  console.log('====================================');

  console.log('Create: 20260121000000_additional_role_filters.sql');
  console.log('Purpose: Filter additional irrelevant roles for business graduates');

  console.log('\nFilters to add:');
  console.log('- Politicians, diplomats, government officials');
  console.log('- Military and security personnel');
  console.log('- Entertainment and sports professionals');
  console.log('- Hospitality and service industry roles');
  console.log('- Retail and sales assistant positions');
  console.log('- Manual labor and technical trades (non-IT)');
  console.log('- Real estate and insurance agents');
  console.log('- Call center and telemarketing roles');

  console.log('\nEstimated impact: 200-500 additional jobs filtered');
  console.log('Focus: Keep only business-relevant roles for graduates');
}

simpleAnalysis().catch(console.error);