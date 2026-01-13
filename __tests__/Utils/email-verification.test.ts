/**
 * Email Verification Utilities Tests
 *
 * Tests the sendVerificationEmail function with proper Resend integration
 */

import { sendVerificationEmail } from "@/utils/email-verification";

// Mock the Resend client
const mockResendSend = jest.fn();
jest.mock("@/utils/email/clients", () => ({
	getResendClient: () => ({
		emails: {
			send: mockResendSend,
		},
	}),
	assertValidFrom: jest.fn(),
	EMAIL_CONFIG: {
		from: "noreply@getjobping.com",
	},
}));

// Mock the logger
jest.mock("@/lib/api-logger", () => ({
	apiLogger: {
		info: jest.fn(),
		error: jest.fn(),
	},
}));

describe("sendVerificationEmail", () => {
	const originalEnv = process.env;

	beforeEach(() => {
		jest.clearAllMocks();
		process.env = { ...originalEnv };
		process.env.RESEND_API_KEY = "re_test_key";
		process.env.NEXT_PUBLIC_BASE_URL = "https://getjobping.com";
		mockResendSend.mockResolvedValue({ data: { id: "test_id" } });
	});

	afterEach(() => {
		process.env = originalEnv;
	});

	it("should send verification email successfully", async () => {
		await sendVerificationEmail("test@example.com");

		expect(mockResendSend).toHaveBeenCalledWith({
			from: "noreply@getjobping.com",
			to: ["test@example.com"],
			subject: "Verify your JobPing email address",
			text: expect.any(String),
			html: expect.any(String),
		});
	});

	it("should include verification link in email", async () => {
		await sendVerificationEmail("user@example.com");

		const callArgs = mockResendSend.mock.calls[0][0];
		expect(callArgs.html).toContain("api/verify-email?");
		expect(callArgs.text).toContain("api/verify-email?");
	});

	it("should handle API errors", async () => {
		mockResendSend.mockRejectedValue(new Error("API Error"));

		await expect(sendVerificationEmail("test@example.com")).rejects.toThrow();
	});

	it("should handle Resend API errors", async () => {
		mockResendSend.mockResolvedValue({
			error: { message: "Invalid recipient" },
		});

		await expect(sendVerificationEmail("invalid@example.com")).rejects.toThrow();
	});
});