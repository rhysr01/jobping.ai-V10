require('dotenv').config({ path: './.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

async function testMatchingCoordinator() {
  console.log('🧪 Testing premium matching coordinator...\n');

  // Get a premium user
  const { data: users, error: userError } = await supabase
    .from('users')
    .select('*')
    .eq('subscription_tier', 'premium')
    .order('created_at', { ascending: false })
    .limit(1);

  if (userError || !users || users.length === 0) {
    console.error('No premium users found');
    return;
  }

  const user = users[0];
  console.log('Testing with user:', user.email);

  // Get some jobs for testing
  const { data: jobs, error: jobsError } = await supabase
    .from('jobs')
    .select('*')
    .eq('is_active', true)
    .eq('status', 'active')
    .is('filtered_reason', null)
    .in('city', user.target_cities || ['London'])
    .limit(50);

  if (jobsError || !jobs) {
    console.error('Error fetching jobs:', jobsError);
    return;
  }

  console.log(`Found ${jobs.length} jobs for testing`);

  // Prepare user preferences in the format expected by the coordinator
  const userPrefs = {
    email: user.email,
    target_cities: user.target_cities,
    languages_spoken: user.languages_spoken,
    career_path: user.career_path ? [user.career_path] : [],
    roles_selected: user.roles_selected,
    entry_level_preference: user.entry_level_preference,
    work_environment: user.work_environment,
    visa_status: user.visa_status,
    skills: user.skills || [],
    industries: user.industries || [],
    company_size_preference: user.company_size_preference,
    career_keywords: user.career_keywords,
    subscription_tier: "premium",
  };

  console.log('User preferences:', JSON.stringify(userPrefs, null, 2));

  try {
    // Try to import and call the coordinator
    console.log('\n🔄 Calling coordinatePremiumMatching...');

    const { coordinatePremiumMatching } = require('./Utils/matching/guaranteed/coordinator.ts');

    const result = await coordinatePremiumMatching(
      jobs,
      userPrefs,
      supabase,
      {
        targetCount: 10,
        targetCities: user.target_cities || [],
        targetWorkEnvironments: [],
      }
    );

    console.log('\n✅ Coordinator completed successfully!');
    console.log('Matches found:', result.matches.length);
    console.log('Matching method:', result.metadata.matchingMethod);
    console.log('Relaxation level:', result.metadata.relaxationLevel);

    if (result.matches.length > 0) {
      console.log('\nTop matches:');
      result.matches.slice(0, 3).forEach((match, i) => {
        console.log(`  ${i + 1}. ${match.job.title} at ${match.job.company} (${match.match_score}%)`);
      });
    }

  } catch (error) {
    console.error('\n❌ Coordinator failed:', error.message);
    console.error('Stack:', error.stack);
  }
}

testMatchingCoordinator();
