import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const maxDuration = 300; // 5 minutes

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");

    // Basic auth check - you should replace this with a proper secret
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    console.log("🛠️ Starting automated maintenance...");

    const results = [];
    let totalFiltered = 0;

    // 1. Company Names Sync
    console.log("▶️  Running: Company Names Sync");
    try {
      const { data: jobsToUpdate, error: selectError } = await supabase
        .from('jobs')
        .select('id, company')
        .is('company_name', null)
        .not('company', 'is', null)
        .neq('company', '')
        .not('filtered_reason', 'like', '%job_board_as_company%');

      if (selectError) throw selectError;

      if (jobsToUpdate && jobsToUpdate.length > 0) {
        // Update each job individually to set company_name = company
        const updatePromises = jobsToUpdate.map(job =>
          supabase
            .from('jobs')
            .update({ company_name: job.company })
            .eq('id', job.id)
        );

        await Promise.all(updatePromises);
        results.push({ step: "Company Names Sync", count: jobsToUpdate.length, status: "success" });
        console.log(`✅ Updated ${jobsToUpdate.length} company names`);
      } else {
        results.push({ step: "Company Names Sync", count: 0, status: "success" });
        console.log(`✅ No company names to update`);
      }
    } catch (error: any) {
      results.push({ step: "Company Names Sync", status: "failed", error: error.message });
      console.error(`❌ Company names sync failed: ${error.message}`);
    }

    // 2. Job Board Filtering
    console.log("▶️  Running: Job Board Filtering");
    try {
      let filteredCount = 0;

      // Filter by exact company names
      const exactCompanies = ['Reed', 'Reed Recruitment', 'Indeed', 'Google', 'StepStone Group', 'StepStone', 'eFinancialCareers', 'efinancial'];

      for (const company of exactCompanies) {
        const { data, error } = await supabase
          .from('jobs')
          .update({
            filtered_reason: 'job_board_as_company',
            company_name: null,
            is_active: false,
            status: 'inactive',
            updated_at: new Date().toISOString()
          })
          .eq('company', company)
          .eq('is_active', true)
          .or('filtered_reason.is.null,filtered_reason.not.like.%job_board_as_company%')
          .select('id');

        if (!error && data) {
          filteredCount += data.length;
        }
      }

      // Filter by pattern matching
      const patterns = ['indeed', 'reed', 'adzuna', 'jobspy', 'linkedin', 'totaljobs', 'monster', 'ziprecruiter', 'efinancial', 'stepstone'];

      for (const pattern of patterns) {
        const { data, error } = await supabase
          .from('jobs')
          .update({
            filtered_reason: 'job_board_as_company',
            company_name: null,
            is_active: false,
            status: 'inactive',
            updated_at: new Date().toISOString()
          })
          .ilike('company', `%${pattern}%`)
          .eq('is_active', true)
          .or('filtered_reason.is.null,filtered_reason.not.like.%job_board_as_company%')
          .not('company', 'ilike', '%recruitment%')
          .not('company', 'ilike', '%staffing%')
          .not('company', 'ilike', '%placement%')
          .select('id');

        if (!error && data) {
          filteredCount += data.length;
        }
      }

      totalFiltered += filteredCount;
      results.push({ step: "Job Board Filtering", count: filteredCount, status: "success" });
      console.log(`✅ Filtered ${filteredCount} job board companies`);
    } catch (error: any) {
      results.push({ step: "Job Board Filtering", status: "failed", error: error.message });
      console.error(`❌ Job board filtering failed: ${error.message}`);
    }

    // 3. CEO & Executive Role Filtering
    console.log("▶️  Running: CEO & Executive Role Filtering");
    try {
      let ceoCount = 0;
      const ceoPatterns = ['ceo', 'chief executive', 'managing director', 'md ', 'cfo', 'cto', 'coo', 'cmo', 'ceo office', 'ceo associate', 'ceo assistant'];

      for (const pattern of ceoPatterns) {
        const { data, error } = await supabase
          .from('jobs')
          .update({
            is_active: false,
            status: 'inactive',
            filtered_reason: 'ceo_executive_role',
            updated_at: new Date().toISOString()
          })
          .ilike('title', `%${pattern}%`)
          .eq('is_active', true)
          .or('filtered_reason.is.null,filtered_reason.not.like.%ceo_executive_role%')
          .select('id');

        if (!error && data) {
          ceoCount += data.length;
        }
      }

      totalFiltered += ceoCount;
      results.push({ step: "CEO & Executive Filtering", count: ceoCount, status: "success" });
      console.log(`✅ Filtered ${ceoCount} CEO/executive roles`);
    } catch (error: any) {
      results.push({ step: "CEO & Executive Filtering", status: "failed", error: error.message });
      console.error(`❌ CEO filtering failed: ${error.message}`);
    }

    // 4. Construction Role Filtering
    console.log("▶️  Running: Construction Role Filtering");
    try {
      let constructionCount = 0;
      const constructionPatterns = ['builder', 'carpenter', 'plumber', 'electrician', 'welder', 'roofer', 'mason', 'painter', 'tiler', 'glazier', 'bricklayer', 'plasterer'];

      // Filter construction trades
      for (const pattern of constructionPatterns) {
        const { data, error } = await supabase
          .from('jobs')
          .update({
            is_active: false,
            status: 'inactive',
            filtered_reason: 'construction_role',
            updated_at: new Date().toISOString()
          })
          .ilike('title', `%${pattern}%`)
          .eq('is_active', true)
          .or('filtered_reason.is.null,filtered_reason.not.like.%construction_role%')
          .select('id');

        if (!error && data) {
          constructionCount += data.length;
        }
      }

      // Filter construction jobs (but not project managers/consultants)
      const { data: constructionJobs, error: constructionError } = await supabase
        .from('jobs')
        .update({
          is_active: false,
          status: 'inactive',
          filtered_reason: 'construction_role',
          updated_at: new Date().toISOString()
        })
        .ilike('title', '%construction%')
        .eq('is_active', true)
        .or('filtered_reason.is.null,filtered_reason.not.like.%construction_role%')
        .not('title', 'ilike', '%project manager%')
        .not('title', 'ilike', '%consultant%')
        .not('title', 'ilike', '%analyst%')
        .select('id');

      if (!constructionError && constructionJobs) {
        constructionCount += constructionJobs.length;
      }

      totalFiltered += constructionCount;
      results.push({ step: "Construction Filtering", count: constructionCount, status: "success" });
      console.log(`✅ Filtered ${constructionCount} construction roles`);
    } catch (error: any) {
      results.push({ step: "Construction Filtering", status: "failed", error: error.message });
      console.error(`❌ Construction filtering failed: ${error.message}`);
    }

    // 5. Medical & Healthcare Role Filtering
    console.log("▶️  Running: Medical & Healthcare Role Filtering");
    try {
      let medicalCount = 0;
      const medicalPatterns = ['nurse', 'doctor', 'physician', 'dentist', 'therapist', 'counselor', 'psychologist', 'pharmacist', 'surgeon', 'veterinarian', 'vet '];

      for (const pattern of medicalPatterns) {
        const { data, error } = await supabase
          .from('jobs')
          .update({
            is_active: false,
            status: 'inactive',
            filtered_reason: 'medical_healthcare_role',
            updated_at: new Date().toISOString()
          })
          .ilike('title', `%${pattern}%`)
          .eq('is_active', true)
          .or('filtered_reason.is.null,filtered_reason.not.like.%medical_healthcare_role%')
          .select('id');

        if (!error && data) {
          medicalCount += data.length;
        }
      }

      // Filter medical doctor/practitioner roles
      const { data: medicalDoctors, error: medicalError } = await supabase
        .from('jobs')
        .update({
          is_active: false,
          status: 'inactive',
          filtered_reason: 'medical_healthcare_role',
          updated_at: new Date().toISOString()
        })
        .ilike('title', '%medical%')
        .or('title.ilike.%doctor%,title.ilike.%practitioner%,title.ilike.%officer%')
        .eq('is_active', true)
        .or('filtered_reason.is.null,filtered_reason.not.like.%medical_healthcare_role%')
        .select('id');

      if (!medicalError && medicalDoctors) {
        medicalCount += medicalDoctors.length;
      }

      totalFiltered += medicalCount;
      results.push({ step: "Medical & Healthcare Filtering", count: medicalCount, status: "success" });
      console.log(`✅ Filtered ${medicalCount} medical/healthcare roles`);
    } catch (error: any) {
      results.push({ step: "Medical & Healthcare Filtering", status: "failed", error: error.message });
      console.error(`❌ Medical filtering failed: ${error.message}`);
    }

    // 6. Legal Role Filtering
    console.log("▶️  Running: Legal Role Filtering");
    try {
      let legalCount = 0;
      const legalPatterns = ['lawyer', 'attorney', 'solicitor', 'barrister'];

      for (const pattern of legalPatterns) {
        const { data, error } = await supabase
          .from('jobs')
          .update({
            is_active: false,
            status: 'inactive',
            filtered_reason: 'legal_role',
            updated_at: new Date().toISOString()
          })
          .ilike('title', `%${pattern}%`)
          .eq('is_active', true)
          .or('filtered_reason.is.null,filtered_reason.not.like.%legal_role%')
          .select('id');

        if (!error && data) {
          legalCount += data.length;
        }
      }

      // Filter legal counsel/advisor roles
      const { data: legalCounsel, error: legalError } = await supabase
        .from('jobs')
        .update({
          is_active: false,
          status: 'inactive',
          filtered_reason: 'legal_role',
          updated_at: new Date().toISOString()
        })
        .ilike('title', '%legal%')
        .or('title.ilike.%counsel%,title.ilike.%advisor%,title.ilike.%officer%')
        .eq('is_active', true)
        .or('filtered_reason.is.null,filtered_reason.not.like.%legal_role%')
        .not('title', 'ilike', '%compliance%')
        .not('title', 'ilike', '%regulatory%')
        .not('title', 'ilike', '%analyst%')
        .not('title', 'ilike', '%junior%')
        .not('title', 'ilike', '%graduate%')
        .not('title', 'ilike', '%intern%')
        .not('title', 'ilike', '%business%')
        .select('id');

      if (!legalError && legalCounsel) {
        legalCount += legalCounsel.length;
      }

      totalFiltered += legalCount;
      results.push({ step: "Legal Filtering", count: legalCount, status: "success" });
      console.log(`✅ Filtered ${legalCount} legal roles`);
    } catch (error: any) {
      results.push({ step: "Legal Filtering", status: "failed", error: error.message });
      console.error(`❌ Legal filtering failed: ${error.message}`);
    }

    // 7. Teaching & Education Role Filtering
    console.log("▶️  Running: Teaching & Education Role Filtering");
    try {
      let teachingCount = 0;
      const teachingPatterns = ['teacher', 'teaching', 'lecturer', 'educator', 'tutor', 'instructor', 'academic'];

      for (const pattern of teachingPatterns) {
        const { data, error } = await supabase
          .from('jobs')
          .update({
            is_active: false,
            status: 'inactive',
            filtered_reason: 'teaching_education_role',
            updated_at: new Date().toISOString()
          })
          .ilike('title', `%${pattern}%`)
          .eq('is_active', true)
          .or('filtered_reason.is.null,filtered_reason.not.like.%teaching_education_role%')
          .not('title', 'ilike', '%business%')
          .not('title', 'ilike', '%corporate%trainer%')
          .not('title', 'ilike', '%corporate%training%')
          .select('id');

        if (!error && data) {
          teachingCount += data.length;
        }
      }

      // Filter professor roles (but not business professors)
      const { data: professors, error: professorError } = await supabase
        .from('jobs')
        .update({
          is_active: false,
          status: 'inactive',
          filtered_reason: 'teaching_education_role',
          updated_at: new Date().toISOString()
        })
        .ilike('title', '%professor%')
        .eq('is_active', true)
        .or('filtered_reason.is.null,filtered_reason.not.like.%teaching_education_role%')
        .not('title', 'ilike', '%business%')
        .not('title', 'ilike', '%assistant professor%business%')
        .select('id');

      if (!professorError && professors) {
        teachingCount += professors.length;
      }

      totalFiltered += teachingCount;
      results.push({ step: "Teaching & Education Filtering", count: teachingCount, status: "success" });
      console.log(`✅ Filtered ${teachingCount} teaching/education roles`);
    } catch (error: any) {
      results.push({ step: "Teaching & Education Filtering", status: "failed", error: error.message });
      console.error(`❌ Teaching filtering failed: ${error.message}`);
    }

    console.log("🎉 Maintenance completed!");
    console.log(`📊 Total jobs filtered: ${totalFiltered}`);

    return NextResponse.json({
      success: true,
      message: "Automated maintenance completed successfully",
      totalFiltered,
      results,
      timestamp: new Date().toISOString()
    });

  } catch (error: any) {
    console.error("❌ Maintenance cron error:", error);
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  // Allow POST requests too for compatibility
  return GET(request);
}
