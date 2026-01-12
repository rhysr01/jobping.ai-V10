/**
 * Comprehensive Monitoring and Error Tracking System
 *
 * This module provides centralized error tracking, performance monitoring,
 * and structured logging for the JobPing application.
 *
 * Features:
 * - Structured logging with multiple output formats (Axiom integration via Vercel)
 * - Performance monitoring and metrics collection
 * - Business metrics tracking for key operations
 * - Context-aware error reporting
 * - Development vs production logging strategies
 */

// Re-export all monitoring functionality from modular structure
export * from "./monitoring/index";
