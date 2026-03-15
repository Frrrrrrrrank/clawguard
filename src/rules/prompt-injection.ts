import type { Rule, Finding, ParsedSkill } from "../types.js";

const ROLE_OVERRIDE_PATTERNS = [
  /ignore\s+(all\s+)?previous\s+instructions/i,
  /disregard\s+(all\s+)?(previous|prior|above)/i,
  /forget\s+(your|all|the)\s+(rules|instructions|guidelines)/i,
];

const ROLE_SWITCH_PATTERNS = [
  /you\s+are\s+now\s+/i,
  /act\s+as\s+(a|an|if)\s+/i,
  /pretend\s+to\s+be\s+/i,
  /from\s+now\s+on[,\s]+you/i,
];

const BASE64_PATTERN = /[A-Za-z0-9+/]{40,}={0,2}/;

// Zero-width characters: U+200B, U+200C, U+200D, U+FEFF, U+2060
const INVISIBLE_UNICODE_PATTERN = /[\u200B\u200C\u200D\uFEFF\u2060]/;

const HIDDEN_COMMENT_INSTRUCTION_PATTERNS = [
  /<!--[\s\S]*?(ignore|disregard|forget|override|system\s*prompt)[\s\S]*?-->/i,
];

export const promptInjectionRule: Rule = {
  id: "prompt-injection",
  severity: "CRITICAL",
  description: "Detects prompt injection patterns in SKILL.md",
  check(skill: ParsedSkill, filePath: string): Finding[] {
    const findings: Finding[] = [];
    const lines = skill.body.split("\n");

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const lineNum = i + 1;

      for (const pattern of ROLE_OVERRIDE_PATTERNS) {
        const match = line.match(pattern);
        if (match) {
          findings.push({
            ruleId: "prompt-injection",
            severity: "CRITICAL",
            message: `Detected instruction-override pattern "${match[0]}"`,
            file: filePath,
            line: lineNum,
          });
        }
      }

      for (const pattern of ROLE_SWITCH_PATTERNS) {
        const match = line.match(pattern);
        if (match) {
          findings.push({
            ruleId: "prompt-injection",
            severity: "CRITICAL",
            message: `Detected role-override pattern "${match[0].trim()}"`,
            file: filePath,
            line: lineNum,
          });
        }
      }

      if (BASE64_PATTERN.test(line)) {
        findings.push({
          ruleId: "prompt-injection",
          severity: "CRITICAL",
          message: "Detected base64 encoded content (may hide malicious instructions)",
          file: filePath,
          line: lineNum,
        });
      }

      if (INVISIBLE_UNICODE_PATTERN.test(line)) {
        findings.push({
          ruleId: "prompt-injection",
          severity: "CRITICAL",
          message: "Detected invisible Unicode characters (may hide text)",
          file: filePath,
          line: lineNum,
        });
      }
    }

    // Check for hidden instructions in HTML comments across the full body
    for (const pattern of HIDDEN_COMMENT_INSTRUCTION_PATTERNS) {
      const match = skill.raw.match(pattern);
      if (match) {
        findings.push({
          ruleId: "prompt-injection",
          severity: "CRITICAL",
          message: "Detected hidden instruction in HTML comment",
          file: filePath,
        });
      }
    }

    return findings;
  },
};
