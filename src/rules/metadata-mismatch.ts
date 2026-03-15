import type { Rule, Finding, ParsedSkill } from "../types.js";

// Match $ENV_VAR, ${ENV_VAR}, process.env.ENV_VAR patterns
const ENV_VAR_PATTERNS = [
  /\$([A-Z_][A-Z0-9_]+)/g,
  /\$\{([A-Z_][A-Z0-9_]+)\}/g,
  /process\.env\.([A-Z_][A-Z0-9_]+)/g,
  /env\.([A-Z_][A-Z0-9_]+)/g,
];

// Match CLI tool invocations
const BIN_USAGE_PATTERN = /(?:^|\s|`)([\w-]+)\s/gm;

const COMMON_WORDS = new Set([
  "the", "and", "for", "you", "use", "run", "can", "will", "this",
  "that", "with", "from", "are", "not", "all", "but", "has", "its",
  "was", "one", "our", "out", "may", "set", "get", "new", "now",
  "any", "how", "each", "make", "like", "then", "them", "been",
  "have", "file", "name", "type", "code", "data", "text", "list",
  "step", "note", "should", "would", "could", "must", "also",
]);

export const metadataMismatchRule: Rule = {
  id: "metadata-mismatch",
  severity: "MEDIUM",
  description: "Detects mismatches between frontmatter declarations and body usage",
  check(skill: ParsedSkill, filePath: string): Finding[] {
    const findings: Finding[] = [];
    const { metadata, body } = skill;
    const declaredEnv = new Set(metadata.requires?.env ?? []);
    const declaredBins = new Set(metadata.requires?.bins ?? []);

    // Find env vars used in body but not declared
    const usedEnvVars = new Set<string>();
    for (const pattern of ENV_VAR_PATTERNS) {
      const regex = new RegExp(pattern.source, pattern.flags);
      let match: RegExpExecArray | null;
      while ((match = regex.exec(body)) !== null) {
        usedEnvVars.add(match[1]);
      }
    }

    for (const envVar of usedEnvVars) {
      if (!declaredEnv.has(envVar)) {
        findings.push({
          ruleId: "metadata-mismatch",
          severity: "MEDIUM",
          message: `Env var ${envVar} used in body but not declared in frontmatter`,
          file: filePath,
        });
      }
    }

    // Find declared bins not used in body
    for (const bin of declaredBins) {
      if (!body.includes(bin)) {
        findings.push({
          ruleId: "metadata-mismatch",
          severity: "MEDIUM",
          message: `Binary "${bin}" declared in frontmatter but never referenced in body`,
          file: filePath,
        });
      }
    }

    return findings;
  },
};
