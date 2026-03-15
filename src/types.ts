export type Severity = "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";

export interface Finding {
  ruleId: string;
  severity: Severity;
  message: string;
  file: string;
  line?: number;
}

export interface FileScanResult {
  file: string;
  findings: Finding[];
}

export interface ScanResult {
  skillPath: string;
  files: FileScanResult[];
  summary: {
    total: number;
    critical: number;
    high: number;
    medium: number;
    low: number;
  };
  passed: boolean;
}

export interface SkillMetadata {
  name?: string;
  description?: string;
  requires?: {
    env?: string[];
    bins?: string[];
  };
  install?: string;
  [key: string]: unknown;
}

export interface ParsedSkill {
  metadata: SkillMetadata;
  body: string;
  raw: string;
}

export interface Rule {
  id: string;
  severity: Severity;
  description: string;
  check(skill: ParsedSkill, filePath: string): Finding[];
}

export interface ScriptFile {
  path: string;
  content: string;
}

export interface ScanOptions {
  rules?: string[];
  minSeverity?: Severity;
  json?: boolean;
  output?: string;
}
