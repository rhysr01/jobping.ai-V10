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

async function testSupabaseConnection() {
  console.log('🔍 Testing Supabase connection...\n');

  try {
    // Test basic connection
    const { data: health, error: healthError } = await supabase
      .from('users')
      .select('count', { count: 'exact', head: true });

    if (healthError) {
      console.error('❌ Supabase connection failed:', healthError);
      return false;
    }

    console.log('✅ Supabase connection successful');
    console.log(`   Users table accessible (${health || 0} total users)`);

    // Test RLS policies
    console.log('\n🔒 Testing RLS policies...');

    // Try to insert a test user (this should work with service role key)
    const testEmail = `test-rls-${Date.now()}@example.com`;
    const { data: insertData, error: insertError } = await supabase
      .from('users')
      .insert([{
        email: testEmail,
        full_name: 'Test RLS User',
        target_cities: ['London'],
        subscription_tier: 'free',
        email_verified: true,
        created_at: new Date().toISOString(),
      }])
      .select()
      .single();

    if (insertError) {
      console.error('❌ RLS insert failed:', insertError);
      console.log('   This suggests RLS policies are blocking service role operations');
      return false;
    }

    console.log('✅ RLS policies working correctly');

    // Clean up test user
    const { error: deleteError } = await supabase
      .from('users')
      .delete()
      .eq('email', testEmail);

    if (deleteError) {
      console.warn('⚠️  Could not clean up test user:', deleteError);
    }

    return true;
  } catch (error) {
    console.error('💥 Connection test failed:', error);
    return false;
  }
}

async function testSignupDataFormat() {
  console.log('\n📝 Testing signup data format...\n');

  // Test the exact data format that would be sent by the frontend
  const signupData = {
    email: `test-format-${Date.now()}@example.com`,
    fullName: "Test User",
    cities: ["London"],
    languages: ["English"],
    careerPath: "entry",
    roles: ["software-engineer"],
    workEnvironment: ["Remote"],
    entryLevelPreferences: ["graduate"],
    visaStatus: "EU",
    industries: ["Technology"],
    companySizePreference: "any",
    skills: ["JavaScript"],
    targetCompanies: [],
    companyTypes: []
  };

  console.log('Signup data to be processed:');
  console.log(JSON.stringify(signupData, null, 2));

  // Transform the data like the signup API does
  const normalizedEmail = signupData.email.toLowerCase().trim();
  const userData = {
    email: normalizedEmail,
    full_name: signupData.fullName.trim(),
    target_cities: signupData.cities,
    languages_spoken: signupData.languages || [],
    start_date: null,
    professional_experience: null,
    professional_expertise: signupData.careerPath || "entry",
    work_environment: Array.isArray(signupData.workEnvironment) && signupData.workEnvironment.length > 0
      ? signupData.workEnvironment.join(", ")
      : null,
    visa_status: signupData.visaStatus || null,
    entry_level_preference: Array.isArray(signupData.entryLevelPreferences) &&
      signupData.entryLevelPreferences.length > 0
      ? signupData.entryLevelPreferences.join(", ")
      : null,
    company_types: signupData.targetCompanies || [],
    career_path: signupData.careerPath || null,
    roles_selected: signupData.roles || [],
    remote_preference: Array.isArray(signupData.workEnvironment) &&
      signupData.workEnvironment.includes("Remote")
      ? "remote"
      : Array.isArray(signupData.workEnvironment) &&
          signupData.workEnvironment.includes("Hybrid")
        ? "hybrid"
        : "flexible",
    industries: signupData.industries || [],
    company_size_preference: signupData.companySizePreference || "any",
    skills: signupData.skills || [],
    career_keywords: signupData.careerKeywords || null,
    subscription_tier: "premium",
    email_verified: true,
    subscription_active: true,
    email_phase: "welcome",
    onboarding_complete: false,
    email_count: 0,
    last_email_sent: null,
    created_at: new Date().toISOString(),
  };

  console.log('\nTransformed user data for database:');
  console.log(JSON.stringify(userData, null, 2));

  // Try to insert this data
  try {
    const { data, error } = await supabase
      .from('users')
      .insert([userData])
      .select()
      .single();

    if (error) {
      console.error('\n❌ Database insert failed:');
      console.error('Error code:', error.code);
      console.error('Error message:', error.message);
      console.error('Error details:', error.details);
      console.error('Error hint:', error.hint);
      return false;
    }

    console.log('\n✅ Database insert successful!');
    console.log('Created user:', data.email);

    // Clean up
    const { error: deleteError } = await supabase
      .from('users')
      .delete()
      .eq('email', normalizedEmail);

    if (deleteError) {
      console.warn('Could not clean up test user:', deleteError);
    }

    return true;
  } catch (error) {
    console.error('\n💥 Insert operation failed:', error);
    return false;
  }
}

async function main() {
  const connectionOk = await testSupabaseConnection();
  if (!connectionOk) {
    console.log('\n❌ Aborting tests due to connection issues');
    return;
  }

  await testSignupDataFormat();
}

main();
