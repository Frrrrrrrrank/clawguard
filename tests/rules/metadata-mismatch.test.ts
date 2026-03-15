import { describe, it, expect } from "vitest";
import { metadataMismatchRule } from "../../src/rules/metadata-mismatch.js";
import { parseSkillMd } from "../../src/parsers/skillmd.js";

describe("metadata-mismatch rule", () => {
  it("should detect undeclared env vars", () => {
    const skill = parseSkillMd("---\nname: test\n---\nUse $GITHUB_TOKEN to authenticate.");
    const findings = metadataMismatchRule.check(skill, "SKILL.md");
    expect(findings.some((f) => f.message.includes("GITHUB_TOKEN"))).toBe(true);
  });

  it("should not flag declared env vars", () => {
    const skill = parseSkillMd("---\nname: test\nrequires:\n  env:\n    - GITHUB_TOKEN\n---\nUse $GITHUB_TOKEN to authenticate.");
    const findings = metadataMismatchRule.check(skill, "SKILL.md");
    expect(findings.filter((f) => f.message.includes("GITHUB_TOKEN"))).toHaveLength(0);
  });

  it("should detect unused declared bins", () => {
    const skill = parseSkillMd("---\nname: test\nrequires:\n  bins:\n    - ffmpeg\n---\nThis skill does text processing only.");
    const findings = metadataMismatchRule.check(skill, "SKILL.md");
    expect(findings.some((f) => f.message.includes("ffmpeg"))).toBe(true);
  });
});
