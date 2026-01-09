"use client";

interface GDPRConsentSectionProps {
	consent: boolean;
	onChange: (consent: boolean) => void;
	isSubmitting: boolean;
}

export function GDPRConsentSection({
	consent,
	onChange,
	isSubmitting,
}: GDPRConsentSectionProps) {
	return (
		<div className="mt-6 p-4 rounded-xl bg-zinc-900/50 border border-zinc-800">
			<label className="flex items-start gap-3 cursor-pointer group">
				<input
					type="checkbox"
					required
					checked={consent}
					onChange={(e) => onChange(e.target.checked)}
					disabled={isSubmitting}
					className="mt-1 w-4 h-4 text-brand-600 bg-zinc-800 border-zinc-600 rounded focus:ring-brand-500 focus:ring-2 disabled:opacity-50 disabled:cursor-not-allowed"
				/>
				<div className="flex-1">
					<p className="text-sm text-content-secondary leading-relaxed">
						I agree to receive job matching emails and understand I can
						unsubscribe at any time. We respect your privacy and never share
						your data. *
					</p>
					<p className="text-xs text-content-muted mt-2">
						By signing up, you agree to our{" "}
						<a
							href="/legal/privacy"
							target="_blank"
							rel="noopener noreferrer"
							className="text-brand-400 hover:text-brand-300 underline"
						>
							Privacy Policy
						</a>{" "}
						and{" "}
						<a
							href="/legal/terms"
							target="_blank"
							rel="noopener noreferrer"
							className="text-brand-400 hover:text-brand-300 underline"
						>
							Terms of Service
						</a>
						.
					</p>
				</div>
			</label>
		</div>
	);
}