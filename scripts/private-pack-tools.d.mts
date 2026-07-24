export const PRIVATE_ROOT: string
export const OUTPUT_FILE: string
export const CLASS_IDS: string[]
export const EDITOR_BUILD_MARKER: string
export type CoverageStatus = 'missing' | 'incomplete' | 'transcribed' | 'verified' | 'ready'
export interface AnalysisIssue { code: string; index: number; reference?: string }
export function parseDelimited(text: string, delimiter?: string): Record<string, unknown>[]
export function parseImport(text: string, format: 'json' | 'csv' | 'tsv'): Record<string, unknown>[]
export function analyzeItems(items: Record<string, unknown>[], existing?: Record<string, unknown>[]): {
  valid: boolean; issues: AnalysisIssue[]; recognizedFields: string[]; missingFields: string[]; replacements: string[]
}
export function coverageReport(items: Record<string, unknown>[]): {
  classCoverage: Record<string, CoverageStatus[]>; completeClasses: number; completeSubclasses: number;
  counts: Record<string, number>; verified: number; incomplete: number; unresolvedReferences: number
}
export function readPrivateSource(root?: string): Promise<{ metadata: Record<string, unknown>; items: Record<string, unknown>[] }>
export function buildPrivatePack(root?: string, output?: string): Promise<{ output: string; coverage: ReturnType<typeof coverageReport>; itemCount: number }>
