"use client";

import { useEffect } from "react";
import { apiCallJson } from "@/lib/api-client";
import { logger } from "@/lib/monitoring";

interface SignupStatsProps {
	activeJobs: string;
	totalUsers: string;
	isLoadingStats: boolean;
	setActiveJobs: (jobs: string) => void;
	setTotalUsers: (users: string) => void;
	setIsLoadingStats: (loading: boolean) => void;
}

export function SignupStats({
	activeJobs,
	totalUsers,
	isLoadingStats,
	setActiveJobs,
	setTotalUsers,
	setIsLoadingStats,
}: SignupStatsProps) {
	useEffect(() => {
		const normalize = (value: unknown): number => {
			if (typeof value === "number" && !Number.isNaN(value)) return value;
			if (typeof value === "string") {
				const numeric = Number(value.replace(/,/g, ""));
				if (!Number.isNaN(numeric)) return numeric;
			}
			return 0;
		};

		apiCallJson<{
			activeJobs?: number;
			activeJobsFormatted?: string;
			totalUsers?: number;
			totalUsersFormatted?: string;
		}>("/api/stats")
			.then((data) => {
				if (!data) {
					setActiveJobs("~12,000");
					setTotalUsers("3,400");
					return;
				}

				const activeValue = normalize(
					data.activeJobs ?? data.activeJobsFormatted,
				);
				const totalValue = normalize(
					data.totalUsers ?? data.totalUsersFormatted,
				);
				const hasFreshStats = activeValue > 0 && totalValue > 0;

				setActiveJobs(
					hasFreshStats ? activeValue.toLocaleString("en-US") : "~12,000",
				);
				setTotalUsers(
					hasFreshStats ? totalValue.toLocaleString("en-US") : "3,400",
				);
			})
			.catch((err) => {
				logger.error("Failed to fetch stats", {
					error: err,
					component: "signup-stats",
					metadata: {
						fallbackValues: { activeJobs: "~12,000", totalUsers: "3,400" },
					},
				});
				setActiveJobs("~12,000");
				setTotalUsers("3,400");
			})
			.finally(() => setIsLoadingStats(false));
	}, [setActiveJobs, setTotalUsers, setIsLoadingStats]);

	return null;
}
