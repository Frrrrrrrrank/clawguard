import type { Rule, Finding, ParsedSkill } from "../types.js";

const DESTRUCTIVE_COMMANDS = [
  { pattern: /rm\s+-rf\s+\/(?:\s|$)/, label: "rm -rf /" },
  { pattern: /rm\s+-rf\s+~/, label: "rm -rf ~" },
  { pattern: /mkfs\./, label: "mkfs (format disk)" },
  { pattern: /:\(\)\{\s*:\|:&\s*\};:/, label: "fork bomb" },
  { pattern: /dd\s+if=.*of=\/dev\//, label: "dd overwrite device" },
];

const SYSTEM_FILE_PATTERNS = [
  { pattern: /(?:echo|cat|tee|write|sed|awk)\s+.*\/etc\//, label: "modify /etc/" },
  { pattern: /(?:echo|cat|tee|write|sed|awk)\s+.*\/usr\//, label: "modify /usr/" },
];

const REMOTE_EXEC_PATTERNS = [
  { pattern: /curl\s+[^\n|]*\|\s*(?:ba)?sh/, label: "curl | sh" },
  { pattern: /wget\s+[^\n|]*\|\s*(?:ba)?sh/, label: "wget | sh" },
  { pattern: /curl\s+[^\n|]*\|\s*python/, label: "curl | python" },
  { pattern: /wget\s+[^\n|]*\|\s*python/, label: "wget | python" },
  { pattern: /curl\s+.*-o\s+.*&&\s*(?:ba)?sh/, label: "curl -o && sh" },
  { pattern: /wget\s+.*-O\s+.*&&\s*(?:ba)?sh/, label: "wget -O && sh" },
];

export const dangerousCommandsRule: Rule = {
  id: "dangerous-commands",
  severity: "HIGH",
  description: "Detects dangerous or destructive commands",
  check(skill: ParsedSkill, filePath: string): Finding[] {
    const findings: Finding[] = [];
    const lines = skill.body.split("\n");

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const lineNum = i + 1;

      for (const { pattern, label } of DESTRUCTIVE_COMMANDS) {
        if (pattern.test(line)) {
          findings.push({
            ruleId: "dangerous-commands",
            severity: "HIGH",
            message: `Detected destructive command: ${label}`,
            file: filePath,
            line: lineNum,
          });
        }
      }

      for (const { pattern, label } of SYSTEM_FILE_PATTERNS) {
        if (pattern.test(line)) {
          findings.push({
            ruleId: "dangerous-commands",
            severity: "HIGH",
            message: `Detected system file modification: ${label}`,
            file: filePath,
            line: lineNum,
          });
        }
      }

      for (const { pattern, label } of REMOTE_EXEC_PATTERNS) {
        if (pattern.test(line)) {
          findings.push({
            ruleId: "dangerous-commands",
            severity: "HIGH",
            message: `Detected remote code execution pattern: ${label}`,
            file: filePath,
            line: lineNum,
          });
        }
      }
    }

    return findings;
  },
};
