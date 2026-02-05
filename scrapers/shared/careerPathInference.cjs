/**
 * Career Path Inference - Two-Stage Filtering for Graduates & Early-Career
 *
 * Stage 1: Seniority Filter (Early Exit)
 * - Reject senior/mid-level roles (not early-career)
 * - Accept only: graduates, interns, juniors, coordinators, associates
 *
 * Stage 2: Career Path Classification
 * - Simple keyword matching for broad career categories
 * - Only runs if Stage 1 passes
 * - 30 core keywords (vs. previous 380)
 *
 * Optimized for university graduates and early-career professionals (<3 years)
 * European market: UK, Germany, France, Netherlands, Spain, Italy, etc.
 */

// ============================================================================
// STAGE 1: SENIORITY FILTER - REJECTS SENIORS, ACCEPTS EARLY-CAREER ONLY
// ============================================================================
// Priority: Reject seniors FIRST to prevent misclassification
// Returns: null (skip), "internship", "graduate", "junior"

const SENIOR_INDICATORS = [
	// Explicit seniority markers (reject these)
	/\bsenior\b/i,
	/\blead\b/i,
	/\bprincipal\b/i,
	/^head of\b/i,
	/\bdirector\b/i,
	/^manager\b/i, // Manager at start of title = likely senior
	/\b(vp|vice president|chief|c-level)\b/i,

	// Experience markers (if mentions 3+ years = likely mid-level)
	/\b3\+?\s*years?\b/i,
	/\b4\+?\s*years?\b/i,
	/\b5\+?\s*years?\b/i,
	/\b[5-9]\+?\s*years?\b/i,
	/\b1[0-9]\+?\s*years?\b/i,
	/\b2[0-9]\+?\s*years?\b/i,
];

const JUNIOR_INDICATORS = [
	/\bjunior\b/i,
	/\bassociate\b/i,
	/\bassistant\b/i,
	/\bcoordinator\b/i,
	/\btrainee\b/i,
	/\bapprenticeship\b/i,
];

const GRADUATE_INDICATORS = [
	/\bgraduate\b/i,
	/\b(grad|gr?ad program|scheme)\b/i,
	/\bscheme\b/i,
];

const INTERNSHIP_INDICATORS = [
	/\bintern(ship)?\b/i,
	/\bplacement\b/i,
	/\bstudent\b/i,
	/\bstagiaire\b/i, // French for internship
];

/**
 * Determine seniority level - STAGE 1 (Early Filter)
 * Returns null if senior (skip job), otherwise returns seniority type
 *
 * @param {string} title - Job title
 * @param {string} description - Job description
 * @returns {string|null} - "internship", "graduate", "junior", or null (skip)
 */
function determineSeniority(title, description = "") {
	const fullText = `${title} ${description}`.toLowerCase();

	// REJECT if ANY senior indicator present
	if (SENIOR_INDICATORS.some((pattern) => pattern.test(fullText))) {
		return null; // Skip this job - not early-career
	}

	// CHECK experience requirement (if explicit, likely junior role)
	if (/\b0?\s*-?\s*2\s*years?\b/i.test(fullText)) {
		// "0-2 years" → junior
		return "junior";
	}

	// ACCEPT early-career indicators (specific type)
	if (INTERNSHIP_INDICATORS.some((pattern) => pattern.test(fullText))) {
		return "internship";
	}

	if (GRADUATE_INDICATORS.some((pattern) => pattern.test(fullText))) {
		return "graduate";
	}

	if (JUNIOR_INDICATORS.some((pattern) => pattern.test(fullText))) {
		return "junior";
	}

	// DEFAULT: If no senior indicators and it's a simple title, assume junior
	// This catches "Data Analyst", "Marketing Coordinator" that don't explicitly say "junior"
	// but are early-career roles
	return "junior";
}

// ============================================================================
// STAGE 2: CAREER PATH KEYWORDS - COMPREHENSIVE ROLE COVERAGE
// ============================================================================
// Priority: Specific job titles (not seniority indicators)
// Only runs if Stage 1 passes (job is early-career)
// ~219 keywords total - comprehensive role coverage across all paths

const CAREER_PATH_KEYWORDS = {
	"strategy-business-design": [
		// Core strategy roles
		"consultant",
		"strategy",
		"business analyst",
		"strategic analyst",
		"transformation",
		"strategic planning",
		"business planning",
		"management consultant",
		// Business-focused roles
		"business architect",
		"process analyst",
		"process improvement",
		"organizational development",
		"policy analyst",
		"change management",
		"improvement specialist",
		// Consulting variants
		"consultant trainee",
		"consulting associate",
		"strategic advisor",
		"strategy consultant",
		// High-value specific phrases (not single words)
		"strategy & operations",
		"operations & strategy",
		"consulting analyst",
		"business case analyst",
		"requirement analyst",
		"requirements analysis",
		"process owner",
		"governance analyst",
		// Healthcare consulting and specialized consulting
		"healthcare consulting",
		"konsulent",
		"consultant healthcare",
		"project leader",
		"projektleiter",
		"m&a",
		"mergers & acquisitions",
		// NEW: Specific consulting roles
		"risk management", // Risk consulting
		"delay analysis", // Project delay consulting
		"peritaje", // Technical assessment/inspection
		"unternehmensentwicklung", // Business development (German)
		// PHASE 3: Additional consulting roles
		"consulting intern", // Clear consulting signal
		"change & release", // Strategy/operations
		"referent geschäftsführung", // German: management advisor
		// PHASE 4: Budget and compliance roles
		"contrôle de gestion", // French: budget control
		"adjoint daf", // French: CFO assistant
		// PHASE 5: Trainee programs and specialist roles
		"mandatsleiter treuhand", // German: trust/fiduciary
		"liquidatore sinistri", // Italian: claims underwriter
		// PHASE 6A: Business Analysis & Project Management
		"project coordinator", // Project support
		"business developer", // Business development
		"project manager", // Project management entry-level
		"chef de projet", // French: project manager
		"business analyst junior", // Junior business analysis
		"management trainee", // Trainee programs
		// PHASE 6B+: Additional strategy & business roles
		"project manager", // Project management (emphasis)
		"team leader", // Team leadership
		"business analyst", // Business analysis (emphasis)
		"management consultant", // Consulting (emphasis)
		"projectleiter", // German: project leader
		// PHASE 6C: Business analyst trainee
		"business analyst trainee", // BA training programs
		// PHASE 6D: Strategy & Business roles from mega batch analysis
		"junior legal counsel", // Entry-level legal/compliance strategy
		"junior lawyer", // Legal profession entry
		"compliance officer", // Risk & compliance
		"compliance junior", // Entry compliance
		"insurance management trainee", // Insurance operations training
		"project leadership", // Project leadership strategy
		"organizational consultant", // Organizational development (emphasis)
		"management trainee", // Management training programs (emphasis)
	],

	"finance-investment": [
		// Core accounting/finance
		"accountant",
		"financial analyst",
		"finance analyst",
		"accounting analyst",
		// Banking & Investment
		"investment analyst",
		"banking",
		"audit",
		"banking associate",
		"credit analyst",
		"credit officer",
		// Specialized finance
		"treasury",
		"treasury analyst",
		"accounting technician",
		"bookkeeper",
		"audit associate",
		"financial controller",
		"financial advisor",
		"tax specialist",
		"accounts payable",
		"accounts receivable",
		"payroll specialist",
		"investment banking",
		"financial planning",
		// Back office specific
		"back office",
		"accounting associate",
		"finance associate",
		"finance officer",
		"accounting support",
		"compliance",
		"accounts management",
		"financial operations",
		// Additional high-value keywords
		"steuerberater",
		"tax advisor",
		"belastingadviseur",
		"payroll",
		"paie",
		"guarantees officer",
		"m&a internship",
		"investment internship",
		"demand planner",
		"fiscal advisor",
		// NEW: Multi-language accounting roles
		"contabile", // Italian: accountant
		"controller", // Financial controller
		"addetto contabile", // Italian: accounting assistant
		"sinistres", // French: insurance claims
		"regolatorio", // Italian: regulatory compliance
		"vermögensberater", // German: wealth advisor
		"gestionnaire sinistres", // French: claims manager
		"insolvenzsachbearbeiter", // German: insolvency accountant
		"collaborateur comptable", // French: accounting colleague
		// PHASE 3: Finance/insurance hybrid
		"insurance advisor", // Insurance/finance role
		"funds company secretary", // Finance operations
		// PHASE 4: Accounting/budgeting roles
		"contrôle gestion", // French: budget/accounting control
		// PHASE 6A: Administrative & Finance
		"buchhalter", // German: accountant/bookkeeper
		"comptable", // French: accountant
		"boekhouden", // Dutch: accounting
		"finance admin", // Finance administrative
		// PHASE 6B+: Additional finance & investment roles
		"financial advisor", // Financial advisory
		"investment advisor", // Investment management
		// Removed: "analyst" - too generic, causes conflicts
		"banker", // Banking operations
		"accountant", // Accounting (emphasis)
		"credit analyst", // Credit assessment
		"treasury specialist", // Treasury operations
		"bookkeeper", // Bookkeeping focus
		// PHASE 6C: Entry-level accounting & finance support
		"accounting clerk", // Accounting support level
		"finance analyst intern", // Finance analyst training programs
		// PHASE 6D: Entry-level finance & investment roles from mega batch
		"credit specialist", // Credit assessment
		"credit analyst junior", // Junior credit analysis
		"investment advisor junior", // Junior investment advice
		"financial planner", // Financial planning (emphasis)
		"audit associate", // Audit operations (emphasis)
		"audit junior", // Junior auditing
		"treasury specialist", // Treasury operations (emphasis)
		"financial controller", // Financial control (emphasis)
		"compliance analyst", // Financial compliance
		"portfolio specialist", // Portfolio management
		// MOVED FROM STRATEGY: Finance-specific roles
		"global finance trainee", // Finance trainee programs
		"chef de mission comptable", // French: accounting mission leader
		"contable junior", // Spanish: junior accountant
	],

	"sales-client-success": [
		// Sales roles
		"account executive",
		"sales representative",
		"sales",
		"business development",
		"business development representative",
		"sales development representative",
		"customer success",
		"customer success manager",
		// Account management
		"account manager",
		"account development",
		"account coordinator",
		"client manager",
		"relationship manager",
		// SDR/BDR variants
		"sdr",
		"bdr",
		"sales coordinator",
		"customer support specialist",
		"customer success associate",
		"customer success coordinator",
		"customer success specialist",
		// Sales variants
		"sales executive",
		"sales associate",
		"key account manager",
		"territory manager",
		"inside sales",
		// Client service specific
		"client service",
		"investor relations",
		"account services",
		// Additional commercial variants
		"commercieel medewerker",
		"commercial",
		"promoter",
		"account officer",
		"guarantees officer",
		// PHASE 6A: Sales & Business Development
		"sdr", // Sales Development Representative (duplicate but emphasized)
		"außendienst", // German: field sales
		"vertriebsunterstützung", // German: sales support
		"account management intern", // Account management entry-level
		"chargé de clientèle", // French: customer service officer
		"incaricate alle vendite", // Italian: sales attendants
		"sales development", // SDR variant
		"client relations", // Client relationship management
		"customer relations", // Customer relationship management
		// PHASE 6B+: Entry-level sales roles from batch analysis
		"account executive", // Account executive (emphasis)
		"business development", // Business development (emphasis)
		"field sales", // Field-based sales
		"inside sales", // Inside sales variant
		"territory manager", // Territory management
		"customer success", // Customer success (emphasis)
		"client relations", // Client relationship (emphasis)
		"customer relations", // Customer relationship (emphasis)
		// PHASE 6C: Account & Sales support roles
		"account coordinator", // Account support level
		"sales support", // Sales operations/support
		"account support", // Account management support
		// PHASE 6D: Sales & Client Success roles from mega batch
		"sales consultant", // Sales consulting roles
		"account manager junior", // Junior account management
		"sales business developer", // Business development in sales context (avoid collision)
		"client advisor", // Client advisory roles
		"territory sales manager", // Territory-based sales (emphasis)
		"sales associate junior", // Entry-level sales
		"inside sales rep", // Inside/remote sales
		// MOVED FROM MARKETING: Sales-focused roles
		"chargé de clientèle", // French: account management/client service
		"client services", // Client-focused service
		// MOVED FROM TECH: CRM-related roles
		"crm specialist", // CRM specialist
		"customer relationship management", // CRM operations
	],

	"marketing-growth": [
		// Core marketing
		"marketing",
		"digital marketing",
		"brand management",
		"growth",
		"content marketing",
		"communications",
		"campaign",
		// Specific marketing roles
		"marketing manager",
		"marketing coordinator",
		"marketing analyst",
		"marketing executive",
		"marketing officer",
		"marketing specialist",
		// Digital marketing
		"digital marketing specialist",
		"content marketing specialist",
		"content marketing coordinator",
		"seo specialist",
		"email marketing",
		"social media manager",
		"social media specialist",
		"social media coordinator",
		// Growth specific
		"growth manager",
		"growth coordinator",
		"growth specialist",
		"growth analyst",
		"performance marketing",
		"brand marketing",
		"brand manager",
		"brand coordinator",
		"campaign manager",
		"campaign coordinator",
		"communications specialist",
		// Creative/design - specific to marketing context
		"product marketing",
		"marketing designer",
		"graphic designer",
		"brand designer",
		"creative specialist",
		"creative director",
		"copywriter",
		"chef de produit",
		"product marketing assistant",
		// Design trainee/experience (marketing adjacent)
		"design trainee",
		"experience design",
		"ui designer",
		"ux designer",
		"art director",
		"layout",
		"visual design",
		"brand identity",
		"design coordinator",
		// Web and content focus
		"webmaster",
		"webmaster ecommerce",
		"texter",
		"content creator",
		"digital communication",
		"paid media specialist",
		// NEW: Specific marketing roles
		"pr-berater", // German: PR consultant
		"marketeer", // Online/recruitment marketing
		"portfolio", // Portfolio management
		"event und kommunikation", // German: event & communications
		// PHASE 3: Advertising and project-based marketing
		"amazon advertising specialist", // Advertising/marketing
		"alternance chef de projet", // French: project manager
		// PHASE 4: PR and communications
		"attaché de presse junior", // French: junior PR officer
		// PHASE 6A: Communications & Specialized Marketing
		"relations publiques", // French: public relations
		"kommunikation", // German: communication
		"kreativ", // German: creative (marketing context)
		"medienberater", // German: media consultant
		"marketing specialist", // Marketing specialist (emphasis)
		"communication", // Communication role
		"pr", // Public relations
		// Removed: "media" - too generic, keep specific roles like "social media"
		// Removed: "creative" - too generic, keep specific roles like "creative director"
		"advertising", // Advertising role
		"werbung", // German: advertising
		"digital communication", // Digital comms (emphasis)
		// PHASE 6B+: Additional marketing & communications roles
		"public relations", // PR operations
		"communications specialist", // Communications focus
		"creative specialist", // Creative operations
		"copywriter", // Content copywriting
		"content creator", // Content creation
		"community manager", // Community management
		"social media", // Social media operations
		"pr specialist", // PR specific role
		// PHASE 6C: Design & creative trainee roles
		"graphic designer trainee", // Design trainee programs
		"design trainee", // General design trainee
		// PHASE 6D: PR, Communications & Marketing roles from mega batch
		"pr specialist junior", // PR entry-level
		"pr coordinator", // Public relations support
		"marketing coordinator", // Marketing operations (emphasis)
		"communications specialist", // Communications operations (emphasis)
		"content writer", // Content creation (emphasis)
		"editorial assistant", // Editorial/publishing
		"event coordinator", // Event management
		"marketing analyst", // Marketing analysis (emphasis)
		"promotion specialist", // Promotional marketing
		"social media manager", // Social media focus (emphasis)
	],

	"product-innovation": [
		// Core product roles
		"product manager",
		"product owner",
		"apm",
		"product analyst",
		"product operations",
		// Product variants
		"associate product manager",
		"junior product manager",
		"product coordinator",
		"product support specialist",
		"product specialist",
		"product team lead",
		"product strategy",
		"product innovation",
		"product development",
		"product manager trainee",
		"pm coordinator",
		"product designer",
		// NEW: Specific product roles
		"portfolio excellence", // Portfolio management
		"produktmanagement", // German: product management
		"portfolio", // Portfolio management/innovation
		"landscape architect", // Design/innovation role
		// PHASE 6D: Product & Innovation roles from mega batch
		"product manager junior", // Junior product management
		"product owner coordinator", // Product ownership coordination
		"product development specialist", // Product development focus
		"product analyst junior", // Junior product analysis
		"innovation specialist", // Innovation operations
	],

	"operations-supply-chain": [
		// Core operations
		"operations",
		"operations manager",
		"operations coordinator",
		"operations specialist",
		"operations officer",
		"operations analyst",
		"operations executive",
		// Supply chain specific
		"supply chain",
		"supply chain specialist",
		"supply chain analyst",
		"supply chain coordinator",
		"supply chain manager",
		// Logistics
		"logistics",
		"logistics specialist",
		"logistics coordinator",
		"logistics officer",
		"warehouse coordinator",
		"warehouse executive",
		// Procurement
		"procurement",
		"procurement specialist",
		"procurement coordinator",
		"procurement officer",
		"purchasing officer",
		// Inventory & Fulfillment
		"inventory",
		"inventory specialist",
		"inventory coordinator",
		"fulfillment",
		"fulfillment specialist",
		"fulfillment coordinator",
		// Planning
		"demand planning",
		"production planner",
		"operations support",
		// Office management & systems (specific to operations)
		"office management",
		"office manager",
		"erp systems",
		"erp analyst",
		"supply chain operations",
		"operations trainee",
		"supply chain support",
		// NEW: Specific operations roles
		"qualitätsmanagement", // German: quality management
		"capacity management", // System operator scheduling
		"einkauf", // German: procurement
		"magazziniere", // Italian: warehouse worker
		"spedizioni", // Italian: shipping/logistics
		"bouwkundig calculator", // Dutch: construction estimator
		"system operator", // Energy systems operations
		// PHASE 3: German/French specialized operations
		"serviceleiter", // German: service manager
		"chargé d'affaires", // French: specialist/project manager
		"fachplaner", // German: specialist planner
		"tirocinante ufficio", // Italian: office admin intern
		// PHASE 4: Quality assurance and specialized operations
		"internal quality assurer", // QA specialist
		"automation & performance", // Operations/automation
		"praktikum einkauf", // German: procurement intern
		// PHASE 5: Operations/technical management roles
		"crm officer", // Customer Relationship Management
		"mes system", // Manufacturing Execution System
		"qualitätstechniker", // German: quality technician
		"kalkulator", // German: cost estimator
		"werkvoorbereider", // Dutch: work planner
		"lading inspecteur", // Dutch: cargo inspector
		"exploitation propreté", // French: facilities management
		// PHASE 6A: Administrative & Operational Support
		"sachbearbeiter", // German: administrative officer/clerk
		"impiegato", // Italian: administrative employee
		"addetto", // Italian: attendant/officer (generic role)
		"koordinator", // German: coordinator
		"coordinateur", // French: coordinator
		"coördinator", // Dutch: coordinator
		"dispatcher", // Logistics dispatcher
		"planner", // Operations planner
		"buyer", // Procurement buyer
		// Removed: "trainee" - too generic, causes conflicts
		"berufseinsteiger", // German: career starter/graduate
		// Removed: "coordinator" - too generic, causes conflicts
		"planning", // Planning role
		"purchasing", // Purchasing role
		"warehouse", // Warehouse operations
		"magazzino", // Italian: warehouse
		"supply chain", // Supply chain (duplicate but emphasized)
		"logistik", // German: logistics
		"material handler", // Material handling
		"handling", // Handling operations
		// PHASE 6B+: Additional operations roles
		"logistics coordinator", // Logistics operational role
		"logistics specialist", // Logistics specific
		"supply chain specialist", // Supply chain focus
		"procurement specialist", // Procurement operations
		"warehouse supervisor", // Warehouse management
		"operations manager", // Operations management (entry-level)
		"inventory specialist", // Inventory operations
		// PHASE 6C: Warehouse, operations, and procurement support
		"warehouse associate", // Entry-level warehouse role
		"operations analyst", // Operations analysis/improvement
		"procurement assistant", // Procurement support level
		// PHASE 6D: Operations & Supply Chain roles from mega batch
		"logistics coordinator", // Logistics operations (emphasis)
		"supply chain coordinator", // Supply chain support (emphasis)
		"warehouse supervisor", // Warehouse management (emphasis)
		"facility manager", // Facility operations
		"stock coordinator", // Inventory management
		"materials planner", // Materials planning
		"import/export specialist", // International logistics
		"operations coordinator", // Operations support (emphasis)
		"efficiency specialist", // Operational efficiency (avoid improvement collision)
		"quality assurance operator", // Quality control operations
		// MOVED FROM SUSTAINABILITY: Quality management roles
		"quality specialist", // Quality management
		"qualitätsmanagement", // German: quality management
		// MOVED FROM TECH: ERP-related roles
		"erp specialist", // ERP specialist
		"enterprise resource planning", // ERP operations
	],

	"data-analytics": [
		// Core data roles
		"data analyst",
		"data analist", // Common misspelling
		"data engineer",
		"analytics engineer",
		"analytics specialist",
		"analytics coordinator",
		// Business intelligence
		"business intelligence",
		"business intelligence analyst",
		"bi developer",
		"reporting analyst",
		// Specialized analytics
		"sql analyst",
		"database analyst",
		"statistical analyst",
		"analytics officer",
		"insights analyst",
		"reporting specialist",
		// Data science
		"data science",
		"data scientist",
		"junior data analyst",
		"junior data engineer",
		"analytics graduate",
		// Business analytics specific
		"business analytics",
		"business analytics & reporting",
		"analytics & reporting",
		"analytics reporting",
		"reporting & analytics",
		"business analytics coordinator",
		"analytics & insights",
		// Data/insights context keywords (for description matching)
		"data insights",
		"data analysis",
		"analytic insights",
		// PHASE 6D: Data & Analytics roles from mega batch
		"data engineer junior", // Junior data engineering
		"analytics specialist", // Analytics operations
		"business intelligence", // BI operations
		"reporting specialist", // Reporting operations
		"data quality specialist", // Data quality assurance
		// MOVED FROM TECH: BI-specific roles
		"bi specialist", // Business intelligence specialist
		"bi-specialist", // Business intelligence specialist (hyphenated)
	],

	"tech-transformation": [
		// Software development
		"software engineer",
		"software developer",
		"developer",
		"backend engineer",
		"backend developer",
		"frontend engineer",
		"frontend developer",
		"full stack engineer",
		"full stack developer",
		// PHASE 6B+: Specific development roles
		"java developer", // Java-specific developer
		"java ontwikkelaar", // Dutch: Java developer
		"web developer", // Web development focus
		"web application", // Web applications
		"api development", // API development
		"python developer", // Python-specific developer
		// PHASE 6C: Additional framework developers
		"react developer", // React-specific frontend
		"application developer", // Enterprise applications
		// Specialized tech
		"devops engineer",
		"devops developer",
		"cloud engineer",
		"cloud developer",
		"database engineer",
		"database administrator",
		"cybersecurity", // Cybersecurity/security focus
		"security engineer", // Security engineering
		"network engineer", // Network engineering
		"infrastructure", // Infrastructure roles
		// IT & Systems
		"systems engineer",
		"systems administrator",
		"systems analyst",
		"systemingenieur", // German: systems engineer
		"it engineer",
		"it specialist",
		"it support",
		"it technician", // IT technical support
		// QA & Testing
		"qa engineer",
		"qa developer",
		"test engineer",
		"quality assurance engineer",
		"quality assurance specialist",
		"qa specialist",
		// PHASE 6C: QA & Testing variants
		"qe", // QA Engineer abbreviation
		"test automation", // Test automation focus
		// Other tech roles
		"programmer",
		"technical support specialist",
		"support engineer",
		"infrastructure engineer",
		"security engineer",
		// Security and help desk
		"cyber security",
		"cybersecurity",
		"help desk",
		"technicien help desk",
		"technicien informatique",
		"security",
		// NEW: Specific tech roles
		"network architect", // Infrastructure specific
		"systems specialist", // Systems specific (M365/Power Platform)
		"serviceservice technician", // Service tech role
		"elektroniker", // German: electronics/electrical tech
		"technischer zeichner", // German: technical draftsman
		"konstrukteur", // German: engineering design
		"structural engineer", // Engineering role
		"it sicherheit", // German: IT security
		// PHASE 3: AI and tech specialists
		"ki-enablement", // AI enablement specialist
		"technology demonstration specialist", // Tech specialist
		// PHASE 4: Design and engineering roles
		"disegnatore mep", // Italian: MEP designer
		"trainee online grafik", // German: online graphic design
		// PHASE 5: Tech specialists and research roles
		"quantitative researcher", // Quant research
		"cyber operator", // Cybersecurity operations
		// PHASE 6A: Tech Infrastructure & Development
		"webentwickler", // German: web developer
		"datenbankadministrator", // German: database administrator
		"network engineer junior", // Network entry-level
		"red cyber operator", // Cybersecurity operations
		"sistemista junior", // Italian: IT systems admin junior
		"developer", // Developer (emphasis)
		"it technician", // IT Technician
		"it support", // IT Support (emphasis)
		"systemingenieur", // German: systems engineer
		"programmer", // Programmer (emphasis)
		"database", // Database role
		// Moved: CRM to sales, ERP to operations
		"web developer", // Web developer
		// PHASE 6D: Tech roles from mega batch analysis
		"javascript developer", // Frontend/backend JavaScript
		"php developer", // PHP web development
		"fullstack web developer", // Full-stack development
		"sharepoint engineer", // SharePoint platforms
		"sql developer", // SQL/Database development
		"plsql developer", // Oracle PL-SQL development
		"rollout technician", // IT rollout/deployment
		"it support technician", // IT technical support
		"it support specialist", // IT help desk level
	],

	"sustainability-esg": [
		// Core sustainability
		"sustainability",
		"sustainability manager",
		"sustainability officer",
		"sustainability specialist",
		"sustainability coordinator",
		"sustainability analyst",
		"sustainability associate",
		// ESG specific
		"esg",
		"esg analyst",
		"esg coordinator",
		"esg specialist",
		"esg officer",
		// Environmental
		"environmental",
		"environmental officer",
		"environmental specialist",
		"environmental coordinator",
		"environmental analyst",
		// Corporate responsibility
		"corporate responsibility",
		"csr coordinator",
		"csr officer",
		"corporate sustainability",
		"sustainability executive",
		"green initiatives",
		"climate analyst",
		// NEW: Specific energy/sustainability roles
		"energiedienstleistung", // German: energy services
		"energie consulting", // Energy consulting
		"energieeffizienz", // German: energy efficiency
	],

	// NOTE: HR/People keywords removed from strategy-business-design
	// If adding "hr-people" category in future, these would belong there:
	// "recruiter", "hr specialist", "people operations", "hr partner", 
	// "hr business partner", "talent acquisition", "recruitment", 
	// "human resources", "people analytics", "organizational development"
};

/**
 * Infer career path from job title and description - STAGE 2
 * Only called if Stage 1 determined job is early-career
 *
 * @param {string} title - Job title
 * @param {string} description - Job description
 * @returns {string|null} - Career path key or null if no match
 */
function inferCareerPath(title, description = "") {
	const searchText = `${title} ${description}`.toLowerCase();
	const titleLower = title.toLowerCase();

	// Score each career path
	const scores = {};

	for (const [path, keywords] of Object.entries(CAREER_PATH_KEYWORDS)) {
		let score = 0;

		for (const keyword of keywords) {
			// Exact match in title (highest weight)
			if (titleLower.includes(keyword)) {
				score += 5;
			}
			// Exact match in description
			else if (searchText.includes(keyword)) {
				score += 2;
			}
			// Word boundary match in title (catch partial matches)
			else if (new RegExp(`\\b${keyword}\\b`, "i").test(titleLower)) {
				score += 4;
			}
			// Word boundary match in description
			else if (new RegExp(`\\b${keyword}\\b`, "i").test(searchText)) {
				score += 1;
			}
		}

		if (score > 0) {
			scores[path] = score;
		}
	}

	// Return highest scoring path
	if (Object.keys(scores).length === 0) {
		return null;
	}

	return Object.entries(scores).sort((a, b) => b[1] - a[1])[0][0];
}

/**
 * Get inferred categories from job data
 * NOTE: Returns ONLY career paths, NOT entry-level type flags
 * Entry-level flags (is_early_career, is_internship, is_graduate) are set separately
 *
 * Two-stage process:
 * 1. Seniority check: Reject seniors (return null = skip job)
 * 2. Career path: Classify if passes seniority check
 *
 * @param {string} title - Job title
 * @param {string} description - Job description
 * @returns {string[]|null} - Array with inferred career path, or null if skip job
 */
function getInferredCategories(title, description = "") {
	// STAGE 1: Check seniority (early filter)
	const seniority = determineSeniority(title, description);

	// If senior role detected, skip entirely (not early-career)
	if (seniority === null) {
		return null; // Signal to skip this job
	}

	// STAGE 2: Infer career path (only for early-career jobs)
	const careerPath = inferCareerPath(title, description);

	// Return career path or default to "unsure"
	return [careerPath || "unsure"];
}

module.exports = {
	// Keyword sets (reusable in other scripts)
	CAREER_PATH_KEYWORDS,
	SENIOR_INDICATORS,
	JUNIOR_INDICATORS,
	GRADUATE_INDICATORS,
	INTERNSHIP_INDICATORS,

	// Core functions
	inferCareerPath,
	determineSeniority,
	getInferredCategories,
};
