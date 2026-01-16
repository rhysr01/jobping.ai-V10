"use client";

import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface JobPingFormFieldProps {
  control: any;
  name: string;
  label: string;
  required?: boolean;
  placeholder?: string;
  helpText?: string;
  type?: string;
  className?: string;
  autoComplete?: string;
  inputMode?: "text" | "email" | "tel" | "url" | "numeric" | "decimal";
  disabled?: boolean;
}

export function JobPingFormField({
  control,
  name,
  label,
  required = false,
  placeholder,
  helpText,
  type = "text",
  className,
  autoComplete,
  inputMode,
  disabled = false,
  ...props
}: JobPingFormFieldProps) {
  return (
    <FormField
      control={control}
      name={name}
      render={({ field, fieldState }) => (
        <FormItem>
          <FormLabel className="block text-base sm:text-lg font-bold text-white mb-2 sm:mb-3 flex items-center gap-2">
            <span>{label}</span>
            {required && <span className="text-red-400 text-sm" aria-label="required">*</span>}
          </FormLabel>

          {helpText && (
            <p className="text-sm font-medium text-zinc-300 mb-3 sm:mb-4 leading-relaxed">
              {helpText}
            </p>
          )}

          <FormControl>
            <Input
              type={type}
              placeholder={placeholder}
              autoComplete={autoComplete}
              inputMode={inputMode}
              disabled={disabled}
              className={cn(
                // Keep your exact mobile-first styling
                "w-full px-4 sm:px-6 py-4 sm:py-5 min-h-[56px]",
                "bg-black/50 border-2 rounded-xl sm:rounded-2xl",
                "text-white placeholder-zinc-400",
                "focus:border-brand-500 focus:outline-none",
                "focus:ring-4 focus:ring-brand-500/30 focus:ring-offset-2 focus:ring-offset-black",
                "transition-all text-base sm:text-lg font-medium backdrop-blur-sm touch-manipulation",
                // Dynamic validation styling - matches SharedFormField
                field.value && !fieldState.error
                  ? "border-green-500/60 shadow-[0_0_20px_rgba(34,197,94,0.2)]"
                  : fieldState.error
                    ? "border-red-500/60 shadow-[0_0_20px_rgba(239,68,68,0.2)]"
                    : "border-zinc-700 hover:border-zinc-600",
                className
              )}
              {...field}
              {...props}
            />
          </FormControl>

          {/* Enhanced error message with icon */}
          <FormMessage className="mt-2 text-sm text-red-400 flex items-center gap-2 font-medium animate-in slide-in-from-top-1 duration-200" />
        </FormItem>
      )}
    />
  );
}