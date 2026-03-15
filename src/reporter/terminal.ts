import chalk from "chalk";
import type { ScanResult, Severity } from "../types.js";

const SEVERITY_COLORS: Record<Severity, (text: string) => string> = {
  CRITICAL: chalk.red.bold,
  HIGH: chalk.red,
  MEDIUM: chalk.yellow,
  LOW: chalk.blue,
};

function pad(text: string, width: number): string {
  return text.padEnd(width);
}

export function reportTerminal(results: ScanResult[]): void {
  console.log(
    chalk.bold.cyan("\n🦞 ClawGuard v0.1.0 - OpenClaw Skill Security Scanner\n")
  );

  for (const result of results) {
    console.log(chalk.bold(`Scanning: ${result.skillPath}\n`));

    for (const fileResult of result.files) {
      console.log(chalk.bold(`  ${fileResult.file}`));

      if (fileResult.findings.length === 0) {
        console.log(chalk.green("  ✓ All checks passed\n"));
        continue;
      }

      // Group findings by rule
      const ruleIds = [...new Set(fileResult.findings.map((f) => f.ruleId))];
      const allRuleIds = [
        "prompt-injection",
        "permission-overreach",
        "suspicious-urls",
        "metadata-mismatch",
        "data-exfiltration",
        "dangerous-commands",
      ];

      for (const finding of fileResult.findings) {
        const color = SEVERITY_COLORS[finding.severity];
        const lineInfo = finding.line ? `Line ${finding.line}: ` : "";
        console.log(
          `  ${chalk.red("✗")} ${color(pad(finding.severity, 10))} ${pad(finding.ruleId, 24)} ${lineInfo}${finding.message}`
        );
      }

      // Show passing rules
      const failedRules = new Set(fileResult.findings.map((f) => f.ruleId));
      for (const ruleId of allRuleIds) {
        if (!failedRules.has(ruleId)) {
          console.log(
            `  ${chalk.green("✓")} ${chalk.green(pad("PASS", 10))} ${ruleId}`
          );
        }
      }
      console.log();
    }

    console.log(chalk.dim("━".repeat(40)));
    const { summary } = result;
    if (summary.total === 0) {
      console.log(chalk.green.bold("  Summary: No issues found"));
      console.log(chalk.green.bold("  Status: PASS ✓\n"));
    } else {
      const parts: string[] = [];
      if (summary.critical > 0) parts.push(`${summary.critical} critical`);
      if (summary.high > 0) parts.push(`${summary.high} high`);
      if (summary.medium > 0) parts.push(`${summary.medium} medium`);
      if (summary.low > 0) parts.push(`${summary.low} low`);
      console.log(
        chalk.bold(`  Summary: ${summary.total} issues found (${parts.join(", ")})`)
      );
      console.log(chalk.red.bold("  Status: FAIL ✗\n"));
    }
  }
}
