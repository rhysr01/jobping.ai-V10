import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { ENV } from "../../../../lib/env";

export const maxDuration = 300; // 5 minutes

export async function GET(request: NextRequest) {
	try {
		const authHeader = request.headers.get("authorization");

		// Basic auth check - you should replace this with a proper secret
		if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		const supabase = createClient(
			ENV.NEXT_PUBLIC_SUPABASE_URL,
			ENV.SUPABASE_SERVICE_ROLE_KEY,
		);

		console.log("🔍 Starting comprehensive job filtering (4x daily)...");

		const results = [];
		let totalFiltered = 0;

		// ============================================================================
		// 1. GOVERNMENT AND POLITICAL ROLES
		// ============================================================================

		console.log("▶️  Filtering: Government & Political Roles");
		try {
			let govCount = 0;
			const govPatterns = [
				"politician",
				"government",
				"minister",
				"ambassador",
				"diplomat",
				"parliament",
				"council",
				"civil servant",
				"public sector",
				"policy",
				"legislation",
			];

			for (const pattern of govPatterns) {
				const { data, error } = await supabase
					.from("jobs")
					.update({
						is_active: false,
						status: "inactive",
						filtered_reason: "government_political_role",
						updated_at: new Date().toISOString(),
					})
					.ilike("title", `%${pattern}%`)
					.eq("is_active", true)
					.or(
						"filtered_reason.is.null,filtered_reason.not.like.%government_political_role%",
					)
					.select("id");

				if (!error && data) {
					govCount += data.length;
				}
			}

			totalFiltered += govCount;
			results.push({
				step: "Government & Political Filtering",
				count: govCount,
				status: "success",
			});
			console.log(`✅ Filtered ${govCount} government/political roles`);
		} catch (error: any) {
			results.push({
				step: "Government & Political Filtering",
				status: "failed",
				error: error.message,
			});
			console.error(`❌ Government filtering failed: ${error.message}`);
		}

		// ============================================================================
		// 2. MILITARY AND DEFENSE ROLES
		// ============================================================================

		console.log("▶️  Filtering: Military & Defense Roles");
		try {
			let militaryCount = 0;
			const militaryPatterns = [
				"military",
				"armed forces",
				"navy",
				"army",
				"air force",
				"defense",
				"security guard",
				"security officer",
			];

			for (const pattern of militaryPatterns) {
				const { data, error } = await supabase
					.from("jobs")
					.update({
						is_active: false,
						status: "inactive",
						filtered_reason: "military_defense_role",
						updated_at: new Date().toISOString(),
					})
					.ilike("title", `%${pattern}%`)
					.eq("is_active", true)
					.or(
						"filtered_reason.is.null,filtered_reason.not.like.%military_defense_role%",
					)
					.select("id");

				if (!error && data) {
					militaryCount += data.length;
				}
			}

			totalFiltered += militaryCount;
			results.push({
				step: "Military & Defense Filtering",
				count: militaryCount,
				status: "success",
			});
			console.log(`✅ Filtered ${militaryCount} military/defense roles`);
		} catch (error: any) {
			results.push({
				step: "Military & Defense Filtering",
				status: "failed",
				error: error.message,
			});
			console.error(`❌ Military filtering failed: ${error.message}`);
		}

		// ============================================================================
		// 3. ENTERTAINMENT AND SPORTS ROLES
		// ============================================================================

		console.log("▶️  Filtering: Entertainment & Sports Roles");
		try {
			let entertainmentCount = 0;
			const entertainmentPatterns = [
				"athlete",
				"actor",
				"actress",
				"musician",
				"singer",
				"performer",
				"entertainment",
				"fitness trainer",
				"gym instructor",
				"personal trainer",
			];

			for (const pattern of entertainmentPatterns) {
				const { data, error } = await supabase
					.from("jobs")
					.update({
						is_active: false,
						status: "inactive",
						filtered_reason: "entertainment_sports_role",
						updated_at: new Date().toISOString(),
					})
					.ilike("title", `%${pattern}%`)
					.eq("is_active", true)
					.or(
						"filtered_reason.is.null,filtered_reason.not.like.%entertainment_sports_role%",
					)
					.select("id");

				if (!error && data) {
					entertainmentCount += data.length;
				}
			}

			totalFiltered += entertainmentCount;
			results.push({
				step: "Entertainment & Sports Filtering",
				count: entertainmentCount,
				status: "success",
			});
			console.log(
				`✅ Filtered ${entertainmentCount} entertainment/sports roles`,
			);
		} catch (error: any) {
			results.push({
				step: "Entertainment & Sports Filtering",
				status: "failed",
				error: error.message,
			});
			console.error(`❌ Entertainment filtering failed: ${error.message}`);
		}

		// ============================================================================
		// 4. HOSPITALITY AND SERVICE INDUSTRY ROLES
		// ============================================================================

		console.log("▶️  Filtering: Hospitality & Service Industry Roles");
		try {
			let hospitalityCount = 0;
			const hospitalityPatterns = [
				"waiter",
				"waitress",
				"bartender",
				"barista",
				"hotel",
				"receptionist",
				"housekeeper",
				"tour guide",
				"tourism",
				"restaurant",
			];

			for (const pattern of hospitalityPatterns) {
				const { data, error } = await supabase
					.from("jobs")
					.update({
						is_active: false,
						status: "inactive",
						filtered_reason: "hospitality_service_role",
						updated_at: new Date().toISOString(),
					})
					.ilike("title", `%${pattern}%`)
					.eq("is_active", true)
					.or(
						"filtered_reason.is.null,filtered_reason.not.like.%hospitality_service_role%",
					)
					.select("id");

				if (!error && data) {
					hospitalityCount += data.length;
				}
			}

			totalFiltered += hospitalityCount;
			results.push({
				step: "Hospitality & Service Filtering",
				count: hospitalityCount,
				status: "success",
			});
			console.log(`✅ Filtered ${hospitalityCount} hospitality/service roles`);
		} catch (error: any) {
			results.push({
				step: "Hospitality & Service Filtering",
				status: "failed",
				error: error.message,
			});
			console.error(`❌ Hospitality filtering failed: ${error.message}`);
		}

		// ============================================================================
		// 5. RETAIL AND SALES ASSISTANT ROLES
		// ============================================================================

		console.log("▶️  Filtering: Retail & Sales Assistant Roles");
		try {
			let retailCount = 0;
			const retailPatterns = [
				"cashier",
				"sales assistant",
				"shop assistant",
				"retail assistant",
				"store assistant",
				"checkout",
			];

			for (const pattern of retailPatterns) {
				const { data, error } = await supabase
					.from("jobs")
					.update({
						is_active: false,
						status: "inactive",
						filtered_reason: "retail_sales_role",
						updated_at: new Date().toISOString(),
					})
					.ilike("title", `%${pattern}%`)
					.eq("is_active", true)
					.or(
						"filtered_reason.is.null,filtered_reason.not.like.%retail_sales_role%",
					)
					.select("id");

				if (!error && data) {
					retailCount += data.length;
				}
			}

			totalFiltered += retailCount;
			results.push({
				step: "Retail & Sales Filtering",
				count: retailCount,
				status: "success",
			});
			console.log(`✅ Filtered ${retailCount} retail/sales roles`);
		} catch (error: any) {
			results.push({
				step: "Retail & Sales Filtering",
				status: "failed",
				error: error.message,
			});
			console.error(`❌ Retail filtering failed: ${error.message}`);
		}

		// ============================================================================
		// 6. MANUAL LABOR AND TECHNICAL TRADES (NON-IT)
		// ============================================================================

		console.log("▶️  Filtering: Manual Labor & Technical Trades (Non-IT)");
		try {
			let manualLaborCount = 0;
			const manualPatterns = [
				"mechanic",
				"electrician",
				"plumber",
				"carpenter",
				"welder",
				"painter",
				"driver",
				"delivery driver",
				"taxi driver",
				"truck driver",
			];

			for (const pattern of manualPatterns) {
				const { data, error } = await supabase
					.from("jobs")
					.update({
						is_active: false,
						status: "inactive",
						filtered_reason: "manual_labor_trade_role",
						updated_at: new Date().toISOString(),
					})
					.ilike("title", `%${pattern}%`)
					.eq("is_active", true)
					.or(
						"filtered_reason.is.null,filtered_reason.not.like.%manual_labor_trade_role%",
					)
					.select("id");

				if (!error && data) {
					manualLaborCount += data.length;
				}
			}

			totalFiltered += manualLaborCount;
			results.push({
				step: "Manual Labor & Trades Filtering",
				count: manualLaborCount,
				status: "success",
			});
			console.log(`✅ Filtered ${manualLaborCount} manual labor/trade roles`);
		} catch (error: any) {
			results.push({
				step: "Manual Labor & Trades Filtering",
				status: "failed",
				error: error.message,
			});
			console.error(`❌ Manual labor filtering failed: ${error.message}`);
		}

		// ============================================================================
		// 7. REAL ESTATE AND INSURANCE SALES ROLES
		// ============================================================================

		console.log("▶️  Filtering: Real Estate & Insurance Sales Roles");
		try {
			let realEstateCount = 0;
			const realEstatePatterns = [
				"real estate agent",
				"property agent",
				"insurance agent",
				"insurance broker",
				"loan officer",
				"mortgage",
				"financial advisor",
			];

			for (const pattern of realEstatePatterns) {
				const { data, error } = await supabase
					.from("jobs")
					.update({
						is_active: false,
						status: "inactive",
						filtered_reason: "real_estate_insurance_role",
						updated_at: new Date().toISOString(),
					})
					.ilike("title", `%${pattern}%`)
					.eq("is_active", true)
					.or(
						"filtered_reason.is.null,filtered_reason.not.like.%real_estate_insurance_role%",
					)
					.select("id");

				if (!error && data) {
					realEstateCount += data.length;
				}
			}

			totalFiltered += realEstateCount;
			results.push({
				step: "Real Estate & Insurance Filtering",
				count: realEstateCount,
				status: "success",
			});
			console.log(`✅ Filtered ${realEstateCount} real estate/insurance roles`);
		} catch (error: any) {
			results.push({
				step: "Real Estate & Insurance Filtering",
				status: "failed",
				error: error.message,
			});
			console.error(`❌ Real estate filtering failed: ${error.message}`);
		}

		// ============================================================================
		// 8. CALL CENTER AND TELEMARKETING ROLES
		// ============================================================================

		console.log("▶️  Filtering: Call Center & Telemarketing Roles");
		try {
			let callCenterCount = 0;
			const callCenterPatterns = [
				"telemarketer",
				"telemarketing",
				"call center",
				"call centre",
				"customer service rep",
				"phone operator",
			];

			for (const pattern of callCenterPatterns) {
				const { data, error } = await supabase
					.from("jobs")
					.update({
						is_active: false,
						status: "inactive",
						filtered_reason: "call_center_telemarketing_role",
						updated_at: new Date().toISOString(),
					})
					.ilike("title", `%${pattern}%`)
					.eq("is_active", true)
					.or(
						"filtered_reason.is.null,filtered_reason.not.like.%call_center_telemarketing_role%",
					)
					.select("id");

				if (!error && data) {
					callCenterCount += data.length;
				}
			}

			totalFiltered += callCenterCount;
			results.push({
				step: "Call Center & Telemarketing Filtering",
				count: callCenterCount,
				status: "success",
			});
			console.log(
				`✅ Filtered ${callCenterCount} call center/telemarketing roles`,
			);
		} catch (error: any) {
			results.push({
				step: "Call Center & Telemarketing Filtering",
				status: "failed",
				error: error.message,
			});
			console.error(`❌ Call center filtering failed: ${error.message}`);
		}

		// ============================================================================
		// 9. EXISTING FILTERS (CEO, Construction, Medical, Legal, Teaching)
		// ============================================================================

		console.log("▶️  Filtering: CEO & Executive Roles");
		try {
			let ceoCount = 0;
			const ceoPatterns = [
				"ceo",
				"chief executive",
				"managing director",
				"cfo",
				"cto",
				"coo",
				"cmo",
			];

			for (const pattern of ceoPatterns) {
				const { data, error } = await supabase
					.from("jobs")
					.update({
						is_active: false,
						status: "inactive",
						filtered_reason: "ceo_executive_role",
						updated_at: new Date().toISOString(),
					})
					.ilike("title", `%${pattern}%`)
					.eq("is_active", true)
					.or(
						"filtered_reason.is.null,filtered_reason.not.like.%ceo_executive_role%",
					)
					.select("id");

				if (!error && data) {
					ceoCount += data.length;
				}
			}

			totalFiltered += ceoCount;
			results.push({
				step: "CEO & Executive Filtering",
				count: ceoCount,
				status: "success",
			});
			console.log(`✅ Filtered ${ceoCount} CEO/executive roles`);
		} catch (error: any) {
			results.push({
				step: "CEO & Executive Filtering",
				status: "failed",
				error: error.message,
			});
			console.error(`❌ CEO filtering failed: ${error.message}`);
		}

		// ============================================================================
		// 10. METADATA QUALITY FILTERS
		// ============================================================================

		console.log("▶️  Filtering: Metadata Quality Issues");
		try {
			let metadataCount = 0;

			// Remove jobs with missing critical data
			const { data: missingDataJobs, error: missingError } = await supabase
				.from("jobs")
				.update({
					is_active: false,
					status: "inactive",
					filtered_reason: "missing_critical_data",
					updated_at: new Date().toISOString(),
				})
				.or('title.is.null,title.eq.\"\"')
				.eq("is_active", true)
				.select("id");

			if (!missingError && missingDataJobs) {
				metadataCount += missingDataJobs.length;
			}

			// Remove suspicious/test jobs
			const { data: suspiciousJobs, error: suspiciousError } = await supabase
				.from("jobs")
				.update({
					is_active: false,
					status: "inactive",
					filtered_reason: "suspicious_test_job",
					updated_at: new Date().toISOString(),
				})
				.or(
					"title.ilike.%test%,title.ilike.%fake%,title.ilike.%dummy%,company.ilike.%test%",
				)
				.eq("is_active", true)
				.select("id");

			if (!suspiciousError && suspiciousJobs) {
				metadataCount += suspiciousJobs.length;
			}

			totalFiltered += metadataCount;
			results.push({
				step: "Metadata Quality Filtering",
				count: metadataCount,
				status: "success",
			});
			console.log(`✅ Filtered ${metadataCount} metadata quality issues`);
		} catch (error: any) {
			results.push({
				step: "Metadata Quality Filtering",
				status: "failed",
				error: error.message,
			});
			console.error(`❌ Metadata filtering failed: ${error.message}`);
		}

		console.log("🎉 Comprehensive filtering completed!");
		console.log(`📊 Total jobs filtered this run: ${totalFiltered}`);

		return NextResponse.json({
			success: true,
			message: "Comprehensive job filtering completed successfully (4x daily)",
			totalFiltered,
			results,
			timestamp: new Date().toISOString(),
			frequency: "4x daily (every 6 hours)",
		});
	} catch (error: any) {
		console.error("❌ Filtering cron error:", error);
		return NextResponse.json(
			{
				success: false,
				error: error.message,
			},
			{ status: 500 },
		);
	}
}

export async function POST(request: NextRequest) {
	// Allow POST requests too for compatibility
	return GET(request);
}
