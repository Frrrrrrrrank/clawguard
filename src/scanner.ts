import { readFileSync, existsSync, statSync } from "node:fs";
import { join, relative, basename } from "node:path";
import { glob } from "glob";
import { parseSkillMd } from "./parsers/skillmd.js";
import { isScriptFile } from "./parsers/scripts.js";
import { getRules } from "./rules/index.js";
import type {
  ScanResult,
  FileScanResult,
  Finding,
  ScanOptions,
  Severity,
  ParsedSkill,
} from "./types.js";

const SEVERITY_ORDER: Record<Severity, number> = {
  CRITICAL: 0,
  HIGH: 1,
  MEDIUM: 2,
  LOW: 3,
};

function meetsMinSeverity(severity: Severity, minSeverity: Severity): boolean {
  return SEVERITY_ORDER[severity] <= SEVERITY_ORDER[minSeverity];
}

export async function scanSkill(
  skillPath: string,
  options: ScanOptions = {}
): Promise<ScanResult> {
  const rules = getRules(options.rules);
  const minSeverity = options.minSeverity ?? "LOW";
  const fileResults: FileScanResult[] = [];

  const stat = statSync(skillPath);
  const dir = stat.isDirectory() ? skillPath : join(skillPath, "..");

  // Find SKILL.md
  const skillMdPath = join(dir, "SKILL.md");
  if (existsSync(skillMdPath)) {
    const content = readFileSync(skillMdPath, "utf-8");
    const parsed = parseSkillMd(content);
    const findings: Finding[] = [];

    for (const rule of rules) {
      const ruleFindings = rule.check(parsed, "SKILL.md");
      findings.push(...ruleFindings);
    }

    fileResults.push({
      file: "SKILL.md",
      findings: findings.filter((f) => meetsMinSeverity(f.severity, minSeverity)),
    });
  }

  // Find script files
  const scriptFiles = await glob("**/*.{sh,bash,py,js,ts,rb,pl}", {
    cwd: dir,
    ignore: ["node_modules/**", "dist/**"],
  });

  for (const scriptFile of scriptFiles) {
    const fullPath = join(dir, scriptFile);
    const content = readFileSync(fullPath, "utf-8");
    // Wrap script content as a pseudo-skill for rule checking
    const pseudoSkill: ParsedSkill = {
      metadata: {},
      body: content,
      raw: content,
    };

    const findings: Finding[] = [];
    for (const rule of rules) {
      // Only run relevant rules on scripts
      if (
        rule.id === "dangerous-commands" ||
        rule.id === "data-exfiltration" ||
        rule.id === "suspicious-urls"
      ) {
        const ruleFindings = rule.check(pseudoSkill, scriptFile);
        findings.push(...ruleFindings);
      }
    }

    if (findings.length > 0) {
      fileResults.push({
        file: scriptFile,
        findings: findings.filter((f) =>
          meetsMinSeverity(f.severity, minSeverity)
        ),
      });
    }
  }

  const allFindings = fileResults.flatMap((f) => f.findings);
  const summary = {
    total: allFindings.length,
    critical: allFindings.filter((f) => f.severity === "CRITICAL").length,
    high: allFindings.filter((f) => f.severity === "HIGH").length,
    medium: allFindings.filter((f) => f.severity === "MEDIUM").length,
    low: allFindings.filter((f) => f.severity === "LOW").length,
  };

  return {
    skillPath: dir,
    files: fileResults,
    summary,
    passed: summary.total === 0,
  };
}

export async function scanDirectory(
  dirPath: string,
  options: ScanOptions = {}
): Promise<ScanResult[]> {
  // Find all directories containing SKILL.md
  const skillFiles = await glob("**/SKILL.md", {
    cwd: dirPath,
    ignore: ["node_modules/**"],
  });

  if (skillFiles.length === 0) {
    // Try scanning as a single skill
    return [await scanSkill(dirPath, options)];
  }

  const results: ScanResult[] = [];
  for (const skillFile of skillFiles) {
    const skillDir = join(dirPath, skillFile, "..");
    results.push(await scanSkill(skillDir, options));
  }
  return results;
}
