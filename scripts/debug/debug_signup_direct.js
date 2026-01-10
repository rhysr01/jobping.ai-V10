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

async function debugSignupIssues() {
  console.log('🔍 Debugging signup success page issues...\n');

  try {
    // Get recent users (last 24 hours)
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    // Check total premium users
    console.log('👑 Total premium users:');
    const { count: premiumCount, error: premiumError } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true })
      .eq('subscription_tier', 'premium');

    if (premiumError) {
      console.error('Error counting premium users:', premiumError);
    } else {
      console.log(`   ${premiumCount || 0} premium users total`);
    }

    console.log('\n📋 Recent premium users (last 7 days):');
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);

    const { data: recentPremiumUsers, error: premiumUsersError } = await supabase
      .from('users')
      .select('email, full_name, created_at, email_count, last_email_sent, subscription_tier')
      .eq('subscription_tier', 'premium')
      .gte('created_at', weekAgo.toISOString())
      .order('created_at', { ascending: false })
      .limit(10);

    if (premiumUsersError) {
      console.error('Error fetching premium users:', premiumUsersError);
    } else if (!recentPremiumUsers || recentPremiumUsers.length === 0) {
      console.log('   No recent premium users found');
    } else {
      console.log(`   Found ${recentPremiumUsers.length} recent premium users:`);
      for (const user of recentPremiumUsers) {
        console.log(`\n👑 Premium User: ${user.email}`);
        console.log(`   Name: ${user.full_name}`);
        console.log(`   Created: ${user.created_at}`);
        console.log(`   Emails sent: ${user.email_count || 0}`);
        console.log(`   Last email: ${user.last_email_sent || 'Never'}`);

        // Get their matches
        const { data: matches, error: matchesError } = await supabase
          .from('matches')
          .select('job_hash, match_score, match_reason, matched_at')
          .eq('user_email', user.email)
          .order('match_score', { ascending: false })
          .limit(5);

        if (matchesError) {
          console.error(`   Error fetching matches: ${matchesError.message}`);
        } else if (!matches || matches.length === 0) {
          console.log('   ❌ No matches found!');
        } else {
          console.log(`   ✅ ${matches.length} matches found (showing top 5):`);
          matches.forEach((match, i) => {
            console.log(`     ${i + 1}. Score: ${(match.match_score * 100).toFixed(1)}% - ${match.match_reason}`);
          });
        }
      }
    }

    console.log('\n📋 Recent users (last 24 hours):');
    const { data: recentUsers, error: usersError } = await supabase
      .from('users')
      .select('email, full_name, created_at, email_count, last_email_sent, subscription_tier')
      .gte('created_at', yesterday.toISOString())
      .order('created_at', { ascending: false })
      .limit(20);

    if (usersError) {
      console.error('Error fetching users:', usersError);
      return;
    }

    if (!recentUsers || recentUsers.length === 0) {
      console.log('No recent users found');
      return;
    }

    for (const user of recentUsers) {
      console.log(`\n👤 User: ${user.email} (${user.subscription_tier})`);
      console.log(`   Name: ${user.full_name}`);
      console.log(`   Created: ${user.created_at}`);
      console.log(`   Emails sent: ${user.email_count || 0}`);
      console.log(`   Last email: ${user.last_email_sent || 'Never'}`);

      // Check matches for all users (both free and premium)

      // Get their matches
      const { data: matches, error: matchesError } = await supabase
        .from('matches')
        .select('job_hash, match_score, match_reason, matched_at')
        .eq('user_email', user.email)
        .order('match_score', { ascending: false })
        .limit(5);

      if (matchesError) {
        console.error(`   Error fetching matches: ${matchesError.message}`);
      } else if (!matches || matches.length === 0) {
        console.log('   ❌ No matches found!');
      } else {
        console.log(`   ✅ ${matches.length} matches found (showing top 5):`);
        matches.forEach((match, i) => {
          console.log(`     ${i + 1}. Score: ${(match.match_score * 100).toFixed(1)}% - ${match.match_reason}`);
        });
      }
    }

    // Get total active jobs
    console.log('\n📊 Database stats:');
    const { count: totalJobs, error: jobsError } = await supabase
      .from('jobs')
      .select('*', { count: 'exact', head: true })
      .eq('is_active', true)
      .eq('status', 'active')
      .is('filtered_reason', null);

    if (jobsError) {
      console.error('Error counting jobs:', jobsError);
    } else {
      console.log(`   Total active jobs: ${totalJobs || 0}`);
    }

    // Check for any signup events in the last hour
    console.log('\n📈 Recent signup events:');
    const oneHourAgo = new Date();
    oneHourAgo.setHours(oneHourAgo.getHours() - 1);

    const { data: signupEvents, error: eventsError } = await supabase
      .from('analytics_events')
      .select('*')
      .eq('event_name', 'signup_success')
      .gte('created_at', oneHourAgo.toISOString())
      .order('created_at', { ascending: false })
      .limit(5);

    if (eventsError) {
      console.error('Error fetching signup events:', eventsError);
    } else if (!signupEvents || signupEvents.length === 0) {
      console.log('   No recent signup events');
    } else {
      console.log(`   Found ${signupEvents.length} recent signup events`);
      signupEvents.forEach(event => {
        console.log(`   - ${event.created_at}: ${JSON.stringify(event.properties || {})}`);
      });
    }

  } catch (error) {
    console.error('Debug script error:', error);
  }
}

debugSignupIssues();
