import { PreferencesFormData, LANGUAGES } from "@/hooks/usePreferences";

interface LanguageLocationSectionProps {
	formData: PreferencesFormData;
	onUpdate: (updates: Partial<PreferencesFormData>) => void;
}

export function LanguageLocationSection({ formData, onUpdate }: LanguageLocationSectionProps) {
	return (
		<div className="space-y-6">
			<div>
				<label className="block text-sm font-medium text-white mb-2">
					Preferred Cities/Locations
				</label>
				<input
					type="text"
					value={formData.cities.join(", ")}
					onChange={(e) => {
						const cities = e.target.value
							.split(",")
							.map((city) => city.trim())
							.filter((city) => city.length > 0);
						onUpdate({ cities });
					}}
					placeholder="e.g., Berlin, Amsterdam, London"
					className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:ring-2 focus:ring-brand-500 focus:border-transparent"
				/>
				<p className="text-xs text-content-secondary mt-1">
					Separate multiple cities with commas
				</p>
			</div>

			<div>
				<label className="block text-sm font-medium text-white mb-2">
					Languages You Speak
				</label>
				<div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-48 overflow-y-auto">
					{LANGUAGES.map((language) => (
						<label key={language} className="flex items-center space-x-2">
							<input
								type="checkbox"
								checked={formData.languages.includes(language)}
								onChange={(e) => {
									const updated = e.target.checked
										? [...formData.languages, language]
										: formData.languages.filter((lang) => lang !== language);
									onUpdate({ languages: updated });
								}}
								className="w-4 h-4 text-brand-600 bg-white/10 border-white/20 rounded focus:ring-brand-500 focus:ring-2"
							/>
							<span className="text-sm text-content-secondary">{language}</span>
						</label>
					))}
				</div>
			</div>
		</div>
	);
}