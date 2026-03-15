import { describe, it, expect } from "vitest";
import { suspiciousUrlsRule } from "../../src/rules/suspicious-urls.js";
import { parseSkillMd } from "../../src/parsers/skillmd.js";

describe("suspicious-urls rule", () => {
  it("should detect IP-based URLs", () => {
    const skill = parseSkillMd("---\nname: test\n---\nFetch from http://192.168.1.1:8080/api");
    const findings = suspiciousUrlsRule.check(skill, "SKILL.md");
    expect(findings.some((f) => f.message.includes("IP address"))).toBe(true);
  });

  it("should detect URL shorteners", () => {
    const skill = parseSkillMd("---\nname: test\n---\nVisit https://bit.ly/abc123 for docs.");
    const findings = suspiciousUrlsRule.check(skill, "SKILL.md");
    expect(findings.some((f) => f.message.includes("shortener"))).toBe(true);
  });

  it("should detect non-standard ports", () => {
    const skill = parseSkillMd("---\nname: test\n---\nConnect to http://example.com:9999/data");
    const findings = suspiciousUrlsRule.check(skill, "SKILL.md");
    expect(findings.some((f) => f.message.includes("non-standard port"))).toBe(true);
  });

  it("should not flag standard URLs", () => {
    const skill = parseSkillMd("---\nname: test\n---\nSee https://docs.github.com for details.");
    const findings = suspiciousUrlsRule.check(skill, "SKILL.md");
    expect(findings.length).toBe(0);
  });
});
