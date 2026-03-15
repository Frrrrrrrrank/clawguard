import type { Rule, Finding, ParsedSkill } from "../types.js";

const SENSITIVE_PATHS = [
  "~/.ssh", "~/.aws", "~/.env", "~/.gnupg", "~/.config",
  "/etc/passwd", "/etc/shadow", "/etc/hosts",
  ".env", "credentials", "id_rsa", "id_ed25519",
  ".npmrc", ".pypirc", ".netrc",
];

const EXFIL_PATTERNS = [
  // curl/wget POST to external URL
  /curl\s+.*-X\s*POST\s/i,
  /curl\s+.*--data\s/i,
  /curl\s+.*-d\s+/i,
  /wget\s+.*--post-data/i,
  /wget\s+.*--post-file/i,
  // Encode file content and append to URL
  /base64\s+.*\|\s*curl/i,
  /cat\s+.*\|\s*curl/i,
  /cat\s+.*\|\s*wget/i,
  // Read + send patterns
  /cat\s+.*\|\s*nc\s/i,
];

const READ_AND_SEND_PATTERN = /(?:cat|read|head|tail|less|more)\s+[^\n|;]*(?:\.ssh|\.aws|\.env|\.gnupg|id_rsa|credentials|passwd|shadow)/i;

export const dataExfiltrationRule: Rule = {
  id: "data-exfiltration",
  severity: "CRITICAL",
  description: "Detects patterns that may exfiltrate sensitive data",
  check(skill: ParsedSkill, filePath: string): Finding[] {
    const findings: Finding[] = [];
    const lines = skill.body.split("\n");

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const lineNum = i + 1;

      // Check for references to sensitive paths
      for (const sensitivePath of SENSITIVE_PATHS) {
        if (line.includes(sensitivePath)) {
          findings.push({
            ruleId: "data-exfiltration",
            severity: "CRITICAL",
            message: `References sensitive path "${sensitivePath}"`,
            file: filePath,
            line: lineNum,
          });
          break;
        }
      }

      // Check for exfiltration patterns
      for (const pattern of EXFIL_PATTERNS) {
        if (pattern.test(line)) {
          findings.push({
            ruleId: "data-exfiltration",
            severity: "CRITICAL",
            message: "Detected data exfiltration pattern (sending data to external service)",
            file: filePath,
            line: lineNum,
          });
          break;
        }
      }
    }

    return findings;
  },
};
