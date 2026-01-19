"use client";

interface SkeletonProps {
	className?: string;
	lines?: number;
}

export function Skeleton({ className = "", lines = 1 }: SkeletonProps) {
	if (lines === 1) {
		return (
			<div
				className={`animate-pulse bg-white/10 rounded ${className}`}
				aria-hidden="true"
			/>
		);
	}

	return (
		<div className="space-y-2" aria-hidden="true">
			{Array.from({ length: lines }).map((_, i) => (
				<div
					key={i}
					className={`animate-pulse bg-white/10 rounded h-4 ${
						i === lines - 1 ? "w-3/4" : "w-full"
					} ${className}`}
				/>
			))}
		</div>
	);
}

export function SkeletonCard({ className = "" }: { className?: string }) {
	return (
		<div
			className={`animate-pulse bg-white/5 border border-white/10 rounded-xl p-6 ${className}`}
		>
			<div className="space-y-3">
				<Skeleton className="h-6 w-1/2" />
				<Skeleton className="h-4 w-full" />
				<Skeleton className="h-4 w-3/4" />
			</div>
		</div>
	);
}

export function SkeletonButton({ className = "" }: { className?: string }) {
	return <Skeleton className={`h-11 w-32 rounded-full ${className}`} />;
}
