"use client";

import React from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface JobPingCardProps {
  intent?: "subtle" | "elevated" | "premium";
  className?: string;
  children: React.ReactNode;
}

export function JobPingCard({ intent = "subtle", className, children }: JobPingCardProps) {
  const intentStyles = {
    subtle: "bg-white/[0.02] border-white/10 hover:border-white/20",
    elevated: "bg-white/[0.05] border-white/15 shadow-lg",
    premium: "bg-gradient-to-b from-zinc-900 to-black border-brand-500/30 shadow-[0_20px_50px_rgba(20,184,166,0.15)]"
  };

  return (
    <Card className={cn(
      // Keep your glass morphism styling - matches GlassCard
      "backdrop-blur-xl transition-all duration-300",
      "rounded-3xl", // Your preferred radius
      intentStyles[intent],
      className
    )}>
      {children}
    </Card>
  );
}

// Export shadcn parts for flexibility
export { CardContent, CardDescription, CardFooter, CardHeader, CardTitle };