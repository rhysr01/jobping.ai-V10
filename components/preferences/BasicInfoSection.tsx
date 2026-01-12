import { PreferencesFormData, EXPERIENCE_LEVELS, WORK_ENVIRONMENTS, VISA_STATUSES } from "@/hooks/usePreferences";

interface BasicInfoSectionProps {
	formData: PreferencesFormData;
	onUpdate: (updates: Partial<PreferencesFormData>) => void;
}

export function BasicInfoSection({ formData, onUpdate }: BasicInfoSectionProps) {
	return (
		<div className="space-y-6">
			<div>
				<label className="block text-sm font-medium text-white mb-2">
					Experience Level *
				</label>
				<select
					value={formData.experience}
					onChange={(e) => onUpdate({ experience: e.target.value })}
					className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:ring-2 focus:ring-brand-500 focus:border-transparent"
					required
				>
					<option value="">Select your experience level</option>
					{EXPERIENCE_LEVELS.map((level) => (
						<option key={level} value={level}>
							{level}
						</option>
					))}
				</select>
			</div>

			<div>
				<label className="block text-sm font-medium text-white mb-2">
					Preferred Company Size
				</label>
				<div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
					{WORK_ENVIRONMENTS.map((env) => (
						<label key={env} className="flex items-center space-x-3">
							<input
								type="checkbox"
								checked={formData.workEnvironment.includes(env)}
								onChange={(e) => {
									const updated = e.target.checked
										? [...formData.workEnvironment, env]
										: formData.workEnvironment.filter((item) => item !== env);
									onUpdate({ workEnvironment: updated });
								}}
								className="w-4 h-4 text-brand-600 bg-white/10 border-white/20 rounded focus:ring-brand-500 focus:ring-2"
							/>
							<span className="text-sm text-content-secondary">{env}</span>
						</label>
					))}
				</div>
			</div>

			<div>
				<label className="block text-sm font-medium text-white mb-2">
					Visa Status
				</label>
				<select
					value={formData.visaStatus}
					onChange={(e) => onUpdate({ visaStatus: e.target.value })}
					className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:ring-2 focus:ring-brand-500 focus:border-transparent"
				>
					<option value="">Select your visa status</option>
					{VISA_STATUSES.map((status) => (
						<option key={status} value={status}>
							{status}
						</option>
					))}
				</select>
			</div>

			<div>
				<label className="block text-sm font-medium text-white mb-2">
					Earliest Start Date
				</label>
				<input
					type="date"
					value={formData.startDate}
					onChange={(e) => onUpdate({ startDate: e.target.value })}
					className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:ring-2 focus:ring-brand-500 focus:border-transparent"
				/>
			</div>
		</div>
	);
}