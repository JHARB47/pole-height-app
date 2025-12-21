/**
 * Type definitions for telemetry.js
 */

export interface TelemetryEnvelope {
  /** Schema version for payload evolution */
  schemaVersion: number;
  /** ISO 8601 timestamp */
  ts: string;
  /** Random UUID per browser session */
  sessionId: string;
  /** App version from build (semver or git SHA) */
  appVersion: string;
  /** Environment: 'prod' | 'dev' */
  env: "prod" | "dev";
  /** Device type: 'mobile' | 'desktop' | 'unknown' */
  device: "mobile" | "desktop" | "unknown";
  /** Current route/pathname for context */
  route: string | null;
  /** Build SHA for release correlation (optional) */
  buildSha?: string;
}

export interface ImportSuccessEvent {
  format: string;
  rowCount: number;
  mappingMode?: "auto" | "manual";
}

export interface ImportErrorEvent {
  format: string;
  errorType: string;
  fileSize?: number;
  rowCount?: number;
  mappingMode?: "auto" | "manual";
}

export interface ExportSuccessEvent {
  format: string;
  itemCount: number;
  durationMs: number;
}

export interface ExportErrorEvent {
  format: string;
  errorMessage: string;
  durationMs?: number;
}

export interface LockedStepTapEvent {
  stepId: string;
  requiresLabel: string;
}

export interface StepCompleteEvent {
  stepId: string;
  durationMs: number;
}

export interface StepEnterEvent {
  stepId: string;
}

/**
 * Log a generic event with automatic envelope fields
 */
export function logEvent(name: string, props?: Record<string, unknown>): void;

/**
 * Log import success
 */
export function logImportSuccess(event: ImportSuccessEvent): void;

/**
 * Log import error
 */
export function logImportError(event: ImportErrorEvent): void;

/**
 * Log export success
 */
export function logExportSuccess(event: ExportSuccessEvent): void;

/**
 * Log export error
 */
export function logExportError(event: ExportErrorEvent): void;

/**
 * Log locked step tap (mobile/desktop)
 */
export function logLockedStepTap(event: LockedStepTapEvent): void;

/**
 * Log step completion with duration
 */
export function logStepComplete(event: StepCompleteEvent): void;

/**
 * Log step entry (for funnel/drop-off analysis)
 */
export function logStepEnter(event: StepEnterEvent): void;

/**
 * Flush queued events to the telemetry endpoint
 */
export function flushEvents(): void;

/**
 * Start periodic telemetry flush
 */
export function startTelemetry(): void;

/**
 * Stop periodic telemetry flush
 */
export function stopTelemetry(): void;
