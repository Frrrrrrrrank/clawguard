#!/usr/bin/env node

import { Command } from "commander";
import { scanSkill, scanDirectory } from "./scanner.js";
import { reportTerminal } from "./reporter/terminal.js";
import { reportJson } from "./reporter/json.js";
import type { Severity } from "./types.js";

const VALID_SEVERITIES = ["CRITICAL", "HIGH", "MEDIUM", "LOW"];

const program = new Command();

program
  .name("clawguard")
  .description("Security scanner for OpenClaw skills 🦞🛡️")
  .version("0.1.0");

program
  .command("scan")
  .description("Scan OpenClaw skill(s) for security issues")
  .argument("<path>", "Path to a skill directory or a directory containing skills")
  .option("--json", "Output results as JSON")
  .option("--rules <rules>", "Comma-separated list of rules to check")
  .option(
    "--min-severity <severity>",
    "Minimum severity to report (CRITICAL, HIGH, MEDIUM, LOW)"
  )
  .option("--output <file>", "Write JSON report to file")
  .action(async (scanPath: string, opts) => {
    const options = {
      json: opts.json ?? false,
      rules: opts.rules ? opts.rules.split(",") : undefined,
      minSeverity: opts.minSeverity
        ? (opts.minSeverity.toUpperCase() as Severity)
        : undefined,
      output: opts.output,
    };

    if (
      options.minSeverity &&
      !VALID_SEVERITIES.includes(options.minSeverity)
    ) {
      console.error(
        `Invalid severity: ${options.minSeverity}. Must be one of: ${VALID_SEVERITIES.join(", ")}`
      );
      process.exit(1);
    }

    try {
      const results = await scanDirectory(scanPath, options);

      if (options.json || options.output) {
        reportJson(results, options.output);
      } else {
        reportTerminal(results);
      }

      const hasIssues = results.some((r) => !r.passed);
      process.exit(hasIssues ? 1 : 0);
    } catch (err) {
      console.error("Scan failed:", (err as Error).message);
      process.exit(2);
    }
  });

program.parse();
