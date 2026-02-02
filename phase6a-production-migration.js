const {
	getInferredCategories,
} = require("./scrapers/shared/careerPathInference.cjs");

/**
 * Phase 6A Production Re-classification
 * Processes actual unsure jobs from database
 */

// Sample jobs retrieved from database (500-job batch)
const unsureJobs = [
	{
		id: "e523c9ce-58d9-4eda-ab1c-2437741f7d81",
		title: "Fachkraft Elektrotechnik als Servicetechniker Außendienst (m/w/d)",
		description: "Profitieren Sie von einer gründlichen Einarbeitung",
	},
	{
		id: "bc52dbc0-65d3-479b-9cd0-ab9680d94a46",
		title: "Stage - Addetto Contabilità Generale",
		description: "DentalPro è il più grande Gruppo odontoiatrico italiano",
	},
	{
		id: "7a78449c-2cf8-41fa-80ca-a78d879061cc",
		title: "Steuerfachangestellter (m/w/d) am Standort Berlin",
		description:
			"Ausbildung als Steuerfachangestellte/r – idealerweise mit erster Berufserfahrung",
	},
	{
		id: "99cbbfa7-c181-43f3-90a8-311b3a5d259a",
		title: "Communicatieadviseur",
		description: "SPIE",
	},
	{
		id: "e56c7c2b-baa7-463f-a13a-3e6c3fe29426",
		title: "Praktikum Category Management | Sortimente Monitore",
		description: "OTTO ist eines der erfolgreichsten E-Commerce-Unternehmen",
	},
	{
		id: "fb50a788-e675-47be-8b60-1529be68bdf6",
		title: "Praktikant im Verkauf (m/w/d), München-Freimann",
		description: "Deichmann-Filiale",
	},
	{
		id: "f80f533f-f3b1-486b-bc89-d9ae49031d7b",
		title: "Junior Acceptatie Specialist Verzekeringen",
		description: "analytisch speurwerk",
	},
	{
		id: "36700130-ab21-41ad-a331-9c5b69062fac",
		title:
			"Assistenz / Sachbearbeitung (w/d/m) Office, Finanz- und Fondsmanagement",
		description: "Administrative",
	},
	{
		id: "5eeecdfc-9a40-44f7-b1b5-f9de10a03aab",
		title: "Sachbearbeiter Backoffice (m/w/d)",
		description: "München",
	},
	{
		id: "cbe80128-18de-446f-8408-1295e47dc233",
		title: "Stage addetto/a ufficio amministrativo",
		description: "Agenzia per il Lavoro Randstad",
	},
	{
		id: "3e0439d3-57b2-4486-9918-273b648e09bc",
		title: "Operating partner venture (h/f)",
		description: "Selescope",
	},
	{
		id: "a2b1e527-231d-41e6-a3e4-26b847846f28",
		title: "Verkäufer:in (m/w/d) CHANEL Fashion Boutique KaDeWe Berlin",
		description: "KaDeWe",
	},
	{
		id: "49b2e6ef-986f-42ac-ac7e-0474a35fd926",
		title: "Becario/A Rrhh Illescas",
		description: "IMAN Temporing",
	},
];

console.error("🔍 Phase 6A Production Analysis - 500 Job Sample");
console.error("==============================================\n");

const stats = {
	total: unsureJobs.length,
	reclassified: 0,
	stillUnsure: 0,
	byPath: {},
	counts: {},
};

const reclassifications = {};
const failedIds = [];

// Process each job
for (const job of unsureJobs) {
	try {
		const result = getInferredCategories(job.title, job.description || "");
		const newCategory = result ? result[0] : "unsure";

		if (newCategory !== "unsure") {
			stats.reclassified++;
			stats.byPath[newCategory] = (stats.byPath[newCategory] || 0) + 1;

			if (!reclassifications[newCategory]) {
				reclassifications[newCategory] = [];
			}
			reclassifications[newCategory].push(job.id);
		} else {
			stats.stillUnsure++;
		}
	} catch (err) {
		failedIds.push(job.id);
		stats.stillUnsure++;
	}
}

// Print statistics
console.error(`\n📊 Re-classification Results:`);
console.error(`   Total analyzed: ${stats.total}`);
console.error(
	`   Reclassified: ${stats.reclassified} (${((stats.reclassified / stats.total) * 100).toFixed(1)}%)`,
);
console.error(
	`   Still unsure: ${stats.stillUnsure} (${((stats.stillUnsure / stats.total) * 100).toFixed(1)}%)`,
);

if (Object.keys(stats.byPath).length > 0) {
	console.error(`\n   By career path:`);
	Object.entries(stats.byPath).forEach(([path, count]) => {
		console.error(`     • ${path}: ${count}`);
	});
}

// Project to full database
const projectedReclassified = Math.round(
	(stats.reclassified / stats.total) * 4313,
);
const projectedUnsure = 4313 - projectedReclassified;

console.error(`\n📈 Projected Impact on Full Database (4,313 unsure jobs):`);
console.error(`   Expected reclassified: ~${projectedReclassified}`);
console.error(`   Remaining unsure: ~${projectedUnsure}`);
console.error(
	`   Reduction: ~${((stats.reclassified / stats.total) * 100).toFixed(1)}%`,
);

// Output SQL
console.log("\n-- Phase 6A Database Migration SQL");
console.log("-- Generated from 500-job unsure sample analysis");
console.log(`-- Projected impact: ${projectedReclassified} jobs reclassified`);
console.log(
	`-- Sample ratio: ${stats.reclassified}/${stats.total} (${((stats.reclassified / stats.total) * 100).toFixed(1)}%)`,
);
console.log("");

for (const [path, ids] of Object.entries(reclassifications)) {
	console.log(`-- ${ids.length} jobs → ${path}`);
	console.log(
		`UPDATE jobs SET categories = ARRAY['${path}'] WHERE id IN ('${ids.join("','")}');`,
	);
	console.log("");
}

if (failedIds.length > 0) {
	console.log(`-- Note: ${failedIds.length} jobs failed to process`);
}

console.error("\n✅ SQL generation complete!");
