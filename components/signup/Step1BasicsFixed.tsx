"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Form } from "@/components/ui/form";
import { JobPingFormField } from "@/components/ui/jobping/form-field";
import CustomButton from "@/components/ui/CustomButton";
import { motion } from "framer-motion";
import { SIGNUP_INITIAL_ROLES } from "../../lib/productMetrics";

const step1Schema = z.object({
	fullName: z.string().min(2, "Full name must be at least 2 characters"),
	email: z.string().email("Please enter a valid email address"),
	university: z.string().optional(),
});

interface Step1BasicsFixedProps {
	onNext: (data: {
		fullName: string;
		email: string;
		university?: string;
	}) => void;
	initialData?: { fullName?: string; email?: string; university?: string };
}

export function Step1BasicsFixed({
	onNext,
	initialData = {},
}: Step1BasicsFixedProps) {
	const form = useForm({
		resolver: zodResolver(step1Schema),
		defaultValues: {
			fullName: initialData.fullName || "",
			email: initialData.email || "",
			university: initialData.university || "",
		},
	});

	const onSubmit = (data: {
		fullName: string;
		email: string;
		university?: string;
	}) => {
		onNext(data); // Pass validated data to parent
	};

	const {
		formState: { isValid },
	} = form;

	return (
		<motion.div
			initial={{ opacity: 0, x: 20 }}
			animate={{ opacity: 1, x: 0 }}
			exit={{ opacity: 0, x: -20 }}
			transition={{ duration: 0.4 }}
			className="space-y-6 sm:space-y-8"
		>
			<div className="mb-6 sm:mb-8">
				<h2 className="text-display-md font-black text-white mb-2 sm:mb-3 bg-gradient-to-r from-white to-zinc-200 bg-clip-text text-transparent">
					Let's get started
				</h2>
				<p className="text-base sm:text-lg font-medium text-zinc-100 leading-relaxed">
					Tell us about yourself
				</p>
			</div>

			<Form {...form}>
				<form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
					<JobPingFormField
						control={form.control}
						name="fullName"
						label="Full Name"
						required
						placeholder="John Smith"
						helpText="Your full name as it appears on your resume"
					/>

					<JobPingFormField
						control={form.control}
						name="email"
						label="Email"
						required
						type="email"
						placeholder="you@example.com"
						helpText={`Get ${SIGNUP_INITIAL_ROLES} jobs in your welcome email, then curated drops 3x per week (Mon/Wed/Fri).`}
					/>

					<JobPingFormField
						control={form.control}
						name="university"
						label="University"
						placeholder="e.g., University of Oxford"
						helpText="Helps us match you with graduate programs and internships"
					/>

					{/* Sticky Submit Button - Keep your existing pattern */}
					<div className="sticky bottom-0 left-0 right-0 z-40 bg-black/90 backdrop-blur-xl border-t border-white/10 shadow-[0_-10px_40px_rgba(0,0,0,0.5)] p-4 pb-[max(1rem,env(safe-area-inset-bottom))] -mx-4 sm:-mx-6">
						<CustomButton
							type="submit"
							disabled={!isValid}
							variant="primary"
							size="lg"
							className="w-full"
						>
							{!isValid ? "Enter your details" : "Continue"}
						</CustomButton>
					</div>
				</form>
			</Form>
		</motion.div>
	);
}
