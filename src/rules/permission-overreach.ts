import type { Rule, Finding, ParsedSkill } from "../types.js";

const DANGEROUS_BINS = new Set([
  "rm", "dd", "chmod", "chown", "sudo", "docker",
  "mkfs", "fdisk", "mount", "umount", "kill", "killall",
  "iptables", "systemctl", "reboot", "shutdown",
]);

const SENSITIVE_ENV_KEYWORDS = [
  "SSH_KEY", "PRIVATE_KEY", "SECRET", "PASSWORD", "CREDENTIALS",
  "AWS_SECRET", "DATABASE_URL", "DB_PASSWORD",
];

const MAX_ENV_VARS = 5;

export const permissionOverreachRule: Rule = {
  id: "permission-overreach",
  severity: "HIGH",
  description: "Detects excessive or dangerous permission requests",
  check(skill: ParsedSkill, filePath: string): Finding[] {
    const findings: Finding[] = [];
    const { metadata } = skill;

    const bins = metadata.requires?.bins ?? [];
    for (const bin of bins) {
      if (DANGEROUS_BINS.has(bin)) {
        findings.push({
          ruleId: "permission-overreach",
          severity: "HIGH",
          message: `Requires dangerous binary "${bin}"`,
          file: filePath,
        });
      }
    }

    const envVars = metadata.requires?.env ?? [];
    if (envVars.length > MAX_ENV_VARS) {
      findings.push({
        ruleId: "permission-overreach",
        severity: "HIGH",
        message: `Requests ${envVars.length} environment variables (threshold: ${MAX_ENV_VARS})`,
        file: filePath,
      });
    }

    for (const envVar of envVars) {
      for (const keyword of SENSITIVE_ENV_KEYWORDS) {
        if (envVar.toUpperCase().includes(keyword)) {
          findings.push({
            ruleId: "permission-overreach",
            severity: "HIGH",
            message: `Requests sensitive environment variable "${envVar}"`,
            file: filePath,
          });
          break;
        }
      }
    }

    return findings;
  },
};
