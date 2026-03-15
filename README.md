```
   _____ _                  _____                     _
  / ____| |                / ____|                   | |
 | |    | | __ ___      __| |  __ _   _  __ _ _ __ __| |
 | |    | |/ _` \ \ /\ / /| | |_ | | | |/ _` | '__/ _` |
 | |____| | (_| |\ V  V / | |__| | |_| | (_| | | | (_| |
  \_____|_|\__,_| \_/\_/   \_____|\__,_|\__,_|_|  \__,_|
```

# ClawGuard 🦞🛡️

> Security scanner for OpenClaw skills. Protect your lobster.

[![CI](https://github.com/Frrrrrrrrank/clawguard/actions/workflows/ci.yml/badge.svg)](https://github.com/Frrrrrrrrank/clawguard/actions)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

ClawGuard is a static security scanner for [OpenClaw](https://github.com/openclaw) skills. It analyzes `SKILL.md` files and associated scripts to detect potential security threats before they reach your system.

## Quick Start

```bash
npx clawguard scan ./my-skill/
```

## Installation

```bash
npm install -g clawguard
```

## Usage

```bash
# Scan a single skill
clawguard scan ./my-skill/

# Scan all skills in a directory
clawguard scan ~/.openclaw/skills/

# JSON output (for CI integration)
clawguard scan ./my-skill/ --json

# Check specific rules only
clawguard scan ./my-skill/ --rules prompt-injection,data-exfiltration

# Set minimum severity threshold
clawguard scan ./my-skill/ --min-severity high

# Write report to file
clawguard scan ./my-skill/ --output report.json
```

## Detection Rules

| Rule | Severity | Description |
|------|----------|-------------|
| `prompt-injection` | CRITICAL | Detects instruction-override patterns, role switching, base64 payloads, invisible Unicode, hidden HTML comments |
| `data-exfiltration` | CRITICAL | Detects patterns that read sensitive files and send data to external services |
| `permission-overreach` | HIGH | Flags dangerous binaries (sudo, rm, docker), excessive env vars, sensitive credentials |
| `suspicious-urls` | HIGH | Identifies IP-based URLs, non-standard ports, URL shorteners, known malicious domains |
| `dangerous-commands` | HIGH | Catches destructive commands (rm -rf /), system file modification, remote code execution (curl \| sh) |
| `metadata-mismatch` | MEDIUM | Finds env vars used but not declared, bins declared but not used |

## GitHub Actions Integration

```yaml
name: Skill Security Check
on: [push, pull_request]
jobs:
  security:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: npx clawguard scan ./skills/ --json --output report.json
      - uses: actions/upload-artifact@v4
        if: failure()
        with:
          name: security-report
          path: report.json
```

## Contributing

Want to add a new detection rule? Each rule is a standalone module in `src/rules/`:

1. Create a new file in `src/rules/` implementing the `Rule` interface
2. Register it in `src/rules/index.ts`
3. Add test fixtures in `tests/fixtures/`
4. Write tests in `tests/rules/`

```typescript
import type { Rule } from "../types.js";

export const myRule: Rule = {
  id: "my-rule",
  severity: "HIGH",
  description: "What this rule detects",
  check(skill, filePath) {
    const findings = [];
    // Your detection logic here
    return findings;
  },
};
```

## License

MIT
