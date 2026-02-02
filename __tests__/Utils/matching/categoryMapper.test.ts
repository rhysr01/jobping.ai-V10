import {
	getDatabaseCategoriesForForm,
	getStudentSatisfactionScore,
	mapDatabaseToForm,
	mapFormLabelToDatabase,
	mapFormToDatabase,
	WORK_TYPE_CATEGORIES,
	CAREER_PATH_LABELS,
} from "../../../utils/matching/categoryMapper";

describe("categoryMapper", () => {
	describe("mapFormToDatabase", () => {
		it("should return value as-is (no mapping needed - long form everywhere)", () => {
			// Form values ARE database categories now (long form)
			expect(mapFormToDatabase("tech-transformation")).toBe(
				"tech-transformation",
			);
			expect(mapFormToDatabase("finance-investment")).toBe(
				"finance-investment",
			);
			expect(mapFormToDatabase("data-analytics")).toBe("data-analytics");
		});

		it("should handle all-categories special case", () => {
			expect(mapFormToDatabase("all-categories")).toBe("all-categories");
		});
	});

	describe("mapFormLabelToDatabase", () => {
		it("should map known form labels to long form", () => {
			expect(mapFormLabelToDatabase("Tech & Transformation")).toBe(
				"tech-transformation",
			);
			expect(mapFormLabelToDatabase("Finance & Investment")).toBe(
				"finance-investment",
			);
			expect(mapFormLabelToDatabase("Data & Analytics")).toBe("data-analytics");
		});

		it('should handle "Not Sure Yet / General"', () => {
			expect(mapFormLabelToDatabase("Not Sure Yet / General")).toBe(
				"all-categories",
			);
		});

		it("should return label as-is for unknown labels", () => {
			expect(mapFormLabelToDatabase("Unknown Label")).toBe("Unknown Label");
		});
	});

	describe("mapDatabaseToForm", () => {
		it("should return value as-is (identity function - no mapping)", () => {
			// Database categories ARE form values now (long form)
			expect(mapDatabaseToForm("tech-transformation")).toBe(
				"tech-transformation",
			);
			expect(mapDatabaseToForm("finance-investment")).toBe(
				"finance-investment",
			);
			expect(mapDatabaseToForm("data-analytics")).toBe("data-analytics");
		});
	});

	describe("getDatabaseCategoriesForForm", () => {
		it("should return array with the form value", () => {
			expect(getDatabaseCategoriesForForm("finance-investment")).toEqual([
				"finance-investment",
			]);
			expect(getDatabaseCategoriesForForm("data-analytics")).toEqual([
				"data-analytics",
			]);
		});

		it("should handle all-categories special case (unsure)", () => {
			expect(getDatabaseCategoriesForForm("all-categories")).toEqual(
				WORK_TYPE_CATEGORIES,
			);
		});
	});

	describe("CAREER_PATH_LABELS", () => {
		it("should map all long form categories to display labels", () => {
			expect(CAREER_PATH_LABELS["strategy-business-design"]).toBe(
				"Strategy & Business Design",
			);
			expect(CAREER_PATH_LABELS["finance-investment"]).toBe(
				"Finance & Investment",
			);
			expect(CAREER_PATH_LABELS["data-analytics"]).toBe("Data & Analytics");
			expect(CAREER_PATH_LABELS["tech-transformation"]).toBe(
				"Tech & Transformation",
			);
		});
	});

	describe("WORK_TYPE_CATEGORIES", () => {
		it("should include all form-selectable categories", () => {
			expect(WORK_TYPE_CATEGORIES).toContain("strategy-business-design");
			expect(WORK_TYPE_CATEGORIES).toContain("finance-investment");
			expect(WORK_TYPE_CATEGORIES).toContain("data-analytics");
			expect(WORK_TYPE_CATEGORIES).toContain("tech-transformation");
			expect(WORK_TYPE_CATEGORIES).toContain("sales-client-success");
			expect(WORK_TYPE_CATEGORIES).toContain("marketing-growth");
			expect(WORK_TYPE_CATEGORIES).toContain("operations-supply-chain");
			expect(WORK_TYPE_CATEGORIES).toContain("product-innovation");
			expect(WORK_TYPE_CATEGORIES).toContain("sustainability-esg");
			expect(WORK_TYPE_CATEGORIES).toContain("all-categories");
		});

		it("should NOT include invalid legacy categories", () => {
			// These should not be in WORK_TYPE_CATEGORIES
			expect(WORK_TYPE_CATEGORIES).not.toContain("retail-luxury");
			expect(WORK_TYPE_CATEGORIES).not.toContain("entrepreneurship");
			expect(WORK_TYPE_CATEGORIES).not.toContain("technology");
		});
	});

	describe("getStudentSatisfactionScore", () => {
		it("should score jobs that match user career paths", () => {
			const jobCategories = ["finance-investment", "early-career"];
			const userFormValues = ["finance-investment"];

			const score = getStudentSatisfactionScore(jobCategories, userFormValues);

			expect(score).toBeGreaterThan(0);
			expect(score).toBeLessThanOrEqual(100);
		});

		it("should return 0 for jobs with no relevant categories", () => {
			const jobCategories = ["retail-luxury"]; // Not in user preferences
			const userFormValues = ["finance-investment"];

			const score = getStudentSatisfactionScore(jobCategories, userFormValues);

			expect(score).toBe(0);
		});

		it("should return neutral score for flexible users with no preferences", () => {
			const jobCategories = ["finance-investment", "early-career"];
			const userFormValues: string[] = [];

			const score = getStudentSatisfactionScore(jobCategories, userFormValues);

			expect(score).toBe(1);
		});

		it("should handle multiple career path preferences", () => {
			const jobCategories = ["finance-investment", "data-analytics"];
			const userFormValues = ["finance-investment", "data-analytics"];

			const score = getStudentSatisfactionScore(jobCategories, userFormValues);

			expect(score).toBeGreaterThan(0);
		});
	});
});
