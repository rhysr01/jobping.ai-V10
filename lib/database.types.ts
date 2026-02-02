export type Json =
	| string
	| number
	| boolean
	| null
	| { [key: string]: Json | undefined }
	| Json[];

export type Database = {
	// Allows to automatically instantiate createClient with right options
	// instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
	__InternalSupabase: {
		PostgrestVersion: "12.2.12 (cd3cf9e)";
	};
	public: {
		Tables: {
			custom_scans: {
				Row: {
					completed_at: string | null;
					created_at: string | null;
					criteria: Json;
					estimated_completion: string | null;
					id: string;
					matches_found: number | null;
					status: string;
					user_email: string;
				};
				Insert: {
					completed_at?: string | null;
					created_at?: string | null;
					criteria: Json;
					estimated_completion?: string | null;
					id?: string;
					matches_found?: number | null;
					status?: string;
					user_email: string;
				};
				Update: {
					completed_at?: string | null;
					created_at?: string | null;
					criteria?: Json;
					estimated_completion?: string | null;
					id?: string;
					matches_found?: number | null;
					status?: string;
					user_email?: string;
				};
				Relationships: [];
			};
			embedding_queue: {
				Row: {
					created_at: string | null;
					id: string;
					job_id: string | null;
					priority: number | null;
					status: string | null;
					updated_at: string | null;
				};
				Insert: {
					created_at?: string | null;
					id?: string;
					job_id?: string | null;
					priority?: number | null;
					status?: string | null;
					updated_at?: string | null;
				};
				Update: {
					created_at?: string | null;
					id?: string;
					job_id?: string | null;
					priority?: number | null;
					status?: string | null;
					updated_at?: string | null;
				};
				Relationships: [
					{
						foreignKeyName: "embedding_queue_job_id_fkey";
						columns: ["job_id"];
						isOneToOne: true;
						referencedRelation: "jobs";
						referencedColumns: ["id"];
					},
				];
			};
			fallback_match_events: {
				Row: {
					created_at: string | null;
					final_preferences: Json;
					id: string;
					matches_found: number;
					min_matches_required: number;
					missing_criteria: Json | null;
					original_preferences: Json;
					relaxation_level: number;
					relaxation_path: string[];
					timestamp: string | null;
					user_email: string;
				};
				Insert: {
					created_at?: string | null;
					final_preferences: Json;
					id?: string;
					matches_found: number;
					min_matches_required: number;
					missing_criteria?: Json | null;
					original_preferences: Json;
					relaxation_level: number;
					relaxation_path: string[];
					timestamp?: string | null;
					user_email: string;
				};
				Update: {
					created_at?: string | null;
					final_preferences?: Json;
					id?: string;
					matches_found?: number;
					min_matches_required?: number;
					missing_criteria?: Json | null;
					original_preferences?: Json;
					relaxation_level?: number;
					relaxation_path?: string[];
					timestamp?: string | null;
					user_email?: string;
				};
				Relationships: [];
			};
			jobs: {
				Row: {
					categories: string[] | null;
					city: string | null;
					company: string;
					company_name: string | null;
					country: string | null;
					created_at: string | null;
					description: string | null;
					embedding: string | null;
					experience_required: string | null;
					expires_at: string | null;
					id: string;
					is_active: boolean | null;
					is_early_career: boolean | null;
					is_graduate: boolean | null;
					is_internship: boolean | null;
					job_hash: string | null;
					job_type: string | null;
					job_url: string | null;
					language_requirements: string[] | null;
					last_seen_at: string | null;
					location: string | null;
					max_yoe: number | null;
					min_yoe: number | null;
					original_posted_date: string | null;
					posted_at: string | null;
					remote_possible: boolean | null;
					salary_currency: string | null;
					salary_max: number | null;
					salary_min: number | null;
					scrape_timestamp: string | null;
					source: string | null;
					source_id: string | null;
					status: string | null;
					tags: string[] | null;
					title: string;
					updated_at: string | null;
					visa_friendly: boolean | null;
					visa_sponsored: boolean | null;
					work_environment: string | null;
				};
				Insert: {
					categories?: string[] | null;
					city?: string | null;
					company: string;
					company_name?: string | null;
					country?: string | null;
					created_at?: string | null;
					description?: string | null;
					embedding?: string | null;
					experience_required?: string | null;
					expires_at?: string | null;
					id?: string;
					is_active?: boolean | null;
					is_early_career?: boolean | null;
					is_graduate?: boolean | null;
					is_internship?: boolean | null;
					job_hash?: string | null;
					job_type?: string | null;
					job_url?: string | null;
					language_requirements?: string[] | null;
					last_seen_at?: string | null;
					location?: string | null;
					max_yoe?: number | null;
					min_yoe?: number | null;
					original_posted_date?: string | null;
					posted_at?: string | null;
					remote_possible?: boolean | null;
					salary_currency?: string | null;
					salary_max?: number | null;
					salary_min?: number | null;
					scrape_timestamp?: string | null;
					source?: string | null;
					source_id?: string | null;
					status?: string | null;
					tags?: string[] | null;
					title: string;
					updated_at?: string | null;
					visa_friendly?: boolean | null;
					visa_sponsored?: boolean | null;
					work_environment?: string | null;
				};
				Update: {
					categories?: string[] | null;
					city?: string | null;
					company?: string;
					company_name?: string | null;
					country?: string | null;
					created_at?: string | null;
					description?: string | null;
					embedding?: string | null;
					experience_required?: string | null;
					expires_at?: string | null;
					id?: string;
					is_active?: boolean | null;
					is_early_career?: boolean | null;
					is_graduate?: boolean | null;
					is_internship?: boolean | null;
					job_hash?: string | null;
					job_type?: string | null;
					job_url?: string | null;
					language_requirements?: string[] | null;
					last_seen_at?: string | null;
					location?: string | null;
					max_yoe?: number | null;
					min_yoe?: number | null;
					original_posted_date?: string | null;
					posted_at?: string | null;
					remote_possible?: boolean | null;
					salary_currency?: string | null;
					salary_max?: number | null;
					salary_min?: number | null;
					scrape_timestamp?: string | null;
					source?: string | null;
					source_id?: string | null;
					status?: string | null;
					tags?: string[] | null;
					title?: string;
					updated_at?: string | null;
					visa_friendly?: boolean | null;
					visa_sponsored?: boolean | null;
					work_environment?: string | null;
				};
				Relationships: [];
			};
			scraping_priorities: {
				Row: {
					created_at: string | null;
					criteria: string;
					demand_count: number | null;
					last_updated: string | null;
				};
				Insert: {
					created_at?: string | null;
					criteria: string;
					demand_count?: number | null;
					last_updated?: string | null;
				};
				Update: {
					created_at?: string | null;
					criteria?: string;
					demand_count?: number | null;
					last_updated?: string | null;
				};
				Relationships: [];
			};
			user_job_preferences: {
				Row: {
					created_at: string | null;
					experience_level: string | null;
					id: string;
					job_types: string[] | null;
					location: string[] | null;
					remote_preference: string | null;
					salary_max: number | null;
					salary_min: number | null;
					updated_at: string | null;
					user_id: string;
					visa_required: boolean | null;
				};
				Insert: {
					created_at?: string | null;
					experience_level?: string | null;
					id?: string;
					job_types?: string[] | null;
					location?: string[] | null;
					remote_preference?: string | null;
					salary_max?: number | null;
					salary_min?: number | null;
					updated_at?: string | null;
					user_id: string;
					visa_required?: boolean | null;
				};
				Update: {
					created_at?: string | null;
					experience_level?: string | null;
					id?: string;
					job_types?: string[] | null;
					location?: string[] | null;
					remote_preference?: string | null;
					salary_max?: number | null;
					salary_min?: number | null;
					updated_at?: string | null;
					user_id?: string;
					visa_required?: boolean | null;
				};
				Relationships: [
					{
						foreignKeyName: "user_job_preferences_user_id_fkey";
						columns: ["user_id"];
						isOneToOne: true;
						referencedRelation: "users";
						referencedColumns: ["id"];
					},
				];
			};
			user_matches: {
				Row: {
					applied_at: string | null;
					created_at: string | null;
					id: string;
					job_id: string;
					match_reason: string | null;
					match_score: number;
					status: string | null;
					updated_at: string | null;
					user_id: string;
				};
				Insert: {
					applied_at?: string | null;
					created_at?: string | null;
					id?: string;
					job_id: string;
					match_reason?: string | null;
					match_score: number;
					status?: string | null;
					updated_at?: string | null;
					user_id: string;
				};
				Update: {
					applied_at?: string | null;
					created_at?: string | null;
					id?: string;
					job_id?: string;
					match_reason?: string | null;
					match_score?: number;
					status?: string | null;
					updated_at?: string | null;
					user_id?: string;
				};
				Relationships: [
					{
						foreignKeyName: "user_matches_job_id_fkey";
						columns: ["job_id"];
						isOneToOne: false;
						referencedRelation: "jobs";
						referencedColumns: ["id"];
					},
					{
						foreignKeyName: "user_matches_user_id_fkey";
						columns: ["user_id"];
						isOneToOne: false;
						referencedRelation: "users";
						referencedColumns: ["id"];
					},
				];
			};
		};
		Views: {
			users: {
				Row: {
					banned_until: string | null;
					confirmed_at: string | null;
					created_at: string | null;
					email: string | null;
					email_change_confirm_status: number | null;
					email_change_sent_at: string | null;
					email_confirmed_at: string | null;
					id: string | null;
					last_sign_in_at: string | null;
					phone_confirmed_at: string | null;
					reauthentication_sent_at: string | null;
					recovery_sent_at: string | null;
					updated_at: string | null;
				};
				Insert: {
					banned_until?: string | null;
					confirmed_at?: string | null;
					created_at?: string | null;
					email?: string | null;
					email_change_confirm_status?: number | null;
					email_change_sent_at?: string | null;
					email_confirmed_at?: string | null;
					id?: string | null;
					last_sign_in_at?: string | null;
					phone_confirmed_at?: string | null;
					reauthentication_sent_at?: string | null;
					recovery_sent_at?: string | null;
					updated_at?: string | null;
				};
				Update: {
					banned_until?: string | null;
					confirmed_at?: string | null;
					created_at?: string | null;
					email?: string | null;
					email_change_confirm_status?: number | null;
					email_change_sent_at?: string | null;
					email_confirmed_at?: string | null;
					id?: string | null;
					last_sign_in_at?: string | null;
					phone_confirmed_at?: string | null;
					reauthentication_sent_at?: string | null;
					recovery_sent_at?: string | null;
					updated_at?: string | null;
				};
				Relationships: [];
			};
		};
		Functions: {
			clean_company_name: { Args: { company_text: string }; Returns: string };
			find_similar_users: {
				Args: {
					match_count?: number;
					match_threshold?: number;
					query_embedding: string;
				};
				Returns: {
					email: string;
					id: string;
					similarity_score: number;
				}[];
			};
			fix_work_environment: {
				Args: never;
				Returns: {
					hybrid_set: number;
					onsite_set: number;
					remote_set: number;
					updated_count: number;
				}[];
			};
			match_jobs_by_embedding: {
				Args: {
					career_path_filter?: string[];
					city_filter?: string[];
					match_count?: number;
					match_threshold?: number;
					query_embedding: string;
				};
				Returns: {
					company: string;
					description: string;
					embedding_distance: number;
					id: number;
					job_hash: string;
					location: string;
					semantic_score: number;
					title: string;
				}[];
			};
			normalize_city_name: { Args: { city_text: string }; Returns: string };
			parse_and_update_location: {
				Args: never;
				Returns: {
					city_filled: number;
					country_filled: number;
					updated_count: number;
				}[];
			};
		};
		Enums: {
			[_ in never]: never;
		};
		CompositeTypes: {
			[_ in never]: never;
		};
	};
};

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">;

type DefaultSchema = DatabaseWithoutInternals[Extract<
	keyof Database,
	"public"
>];

export type Tables<
	DefaultSchemaTableNameOrOptions extends
		| keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
		| { schema: keyof DatabaseWithoutInternals },
	TableName extends DefaultSchemaTableNameOrOptions extends {
		schema: keyof DatabaseWithoutInternals;
	}
		? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
				DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
		: never = never,
> = DefaultSchemaTableNameOrOptions extends {
	schema: keyof DatabaseWithoutInternals;
}
	? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
			DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
			Row: infer R;
		}
		? R
		: never
	: DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
				DefaultSchema["Views"])
		? (DefaultSchema["Tables"] &
				DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
				Row: infer R;
			}
			? R
			: never
		: never;

export type TablesInsert<
	DefaultSchemaTableNameOrOptions extends
		| keyof DefaultSchema["Tables"]
		| { schema: keyof DatabaseWithoutInternals },
	TableName extends DefaultSchemaTableNameOrOptions extends {
		schema: keyof DatabaseWithoutInternals;
	}
		? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
		: never = never,
> = DefaultSchemaTableNameOrOptions extends {
	schema: keyof DatabaseWithoutInternals;
}
	? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
			Insert: infer I;
		}
		? I
		: never
	: DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
		? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
				Insert: infer I;
			}
			? I
			: never
		: never;

export type TablesUpdate<
	DefaultSchemaTableNameOrOptions extends
		| keyof DefaultSchema["Tables"]
		| { schema: keyof DatabaseWithoutInternals },
	TableName extends DefaultSchemaTableNameOrOptions extends {
		schema: keyof DatabaseWithoutInternals;
	}
		? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
		: never = never,
> = DefaultSchemaTableNameOrOptions extends {
	schema: keyof DatabaseWithoutInternals;
}
	? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
			Update: infer U;
		}
		? U
		: never
	: DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
		? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
				Update: infer U;
			}
			? U
			: never
		: never;

export type Enums<
	DefaultSchemaEnumNameOrOptions extends
		| keyof DefaultSchema["Enums"]
		| { schema: keyof DatabaseWithoutInternals },
	EnumName extends DefaultSchemaEnumNameOrOptions extends {
		schema: keyof DatabaseWithoutInternals;
	}
		? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
		: never = never,
> = DefaultSchemaEnumNameOrOptions extends {
	schema: keyof DatabaseWithoutInternals;
}
	? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
	: DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
		? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
		: never;

export type CompositeTypes<
	PublicCompositeTypeNameOrOptions extends
		| keyof DefaultSchema["CompositeTypes"]
		| { schema: keyof DatabaseWithoutInternals },
	CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
		schema: keyof DatabaseWithoutInternals;
	}
		? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
		: never = never,
> = PublicCompositeTypeNameOrOptions extends {
	schema: keyof DatabaseWithoutInternals;
}
	? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
	: PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
		? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
		: never;

export const Constants = {
	public: {
		Enums: {},
	},
} as const;
