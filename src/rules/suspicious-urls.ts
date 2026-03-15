import type { Rule, Finding, ParsedSkill } from "../types.js";

const URL_REGEX = /https?:\/\/[^\s)>\]"']+/gi;
const IP_URL_REGEX = /https?:\/\/\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}/i;
const NON_STANDARD_PORT_REGEX = /https?:\/\/[^/:]+:(?!443|80)\d+/i;
const URL_SHORTENERS = [
  "bit.ly", "t.co", "tinyurl.com", "goo.gl", "is.gd",
  "buff.ly", "ow.ly", "rebrand.ly", "bl.ink", "short.io",
];
const DATA_URI_PATTERN = /data:[a-z]+\/[a-z]+;base64,/i;

const KNOWN_MALICIOUS_DOMAINS = [
  "evil.com", "malware.example.com",
];

export const suspiciousUrlsRule: Rule = {
  id: "suspicious-urls",
  severity: "HIGH",
  description: "Detects suspicious URLs in skill files",
  check(skill: ParsedSkill, filePath: string): Finding[] {
    const findings: Finding[] = [];
    const lines = skill.body.split("\n");

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const lineNum = i + 1;
      const urls = line.match(URL_REGEX) ?? [];

      for (const url of urls) {
        if (IP_URL_REGEX.test(url)) {
          findings.push({
            ruleId: "suspicious-urls",
            severity: "HIGH",
            message: `URL uses IP address directly: ${url}`,
            file: filePath,
            line: lineNum,
          });
        }

        if (NON_STANDARD_PORT_REGEX.test(url)) {
          findings.push({
            ruleId: "suspicious-urls",
            severity: "HIGH",
            message: `URL uses non-standard port: ${url}`,
            file: filePath,
            line: lineNum,
          });
        }

        for (const shortener of URL_SHORTENERS) {
          if (url.toLowerCase().includes(shortener)) {
            findings.push({
              ruleId: "suspicious-urls",
              severity: "HIGH",
              message: `URL uses shortener service (${shortener}): ${url}`,
              file: filePath,
              line: lineNum,
            });
            break;
          }
        }

        for (const domain of KNOWN_MALICIOUS_DOMAINS) {
          if (url.toLowerCase().includes(domain)) {
            findings.push({
              ruleId: "suspicious-urls",
              severity: "HIGH",
              message: `URL points to known malicious domain: ${url}`,
              file: filePath,
              line: lineNum,
            });
            break;
          }
        }
      }

      if (DATA_URI_PATTERN.test(line)) {
        findings.push({
          ruleId: "suspicious-urls",
          severity: "HIGH",
          message: "Detected data: URI scheme (may embed malicious content)",
          file: filePath,
          line: lineNum,
        });
      }
    }

    return findings;
  },
};
