import { describe, it, expect } from "vitest";
import { permissionOverreachRule } from "../../src/rules/permission-overreach.js";
import { parseSkillMd } from "../../src/parsers/skillmd.js";
import { readFileSync } from "node:fs";
import { join } from "node:path";

describe("permission-overreach rule", () => {
  it("should detect dangerous binaries", () => {
    const skill = parseSkillMd("---\nname: test\nrequires:\n  bins:\n    - sudo\n    - rm\n---\nDo things.");
    const findings = permissionOverreachRule.check(skill, "SKILL.md");
    expect(findings.length).toBe(2);
  });

  it("should detect too many env vars", () => {
    const skill = parseSkillMd("---\nname: test\nrequires:\n  env:\n    - A\n    - B\n    - C\n    - D\n    - E\n    - F\n---\nDo things.");
    const findings = permissionOverreachRule.check(skill, "SKILL.md");
    expect(findings.some((f) => f.message.includes("6 environment variables"))).toBe(true);
  });

  it("should detect sensitive env var names", () => {
    const skill = parseSkillMd("---\nname: test\nrequires:\n  env:\n    - SSH_KEY\n    - PRIVATE_KEY\n---\nDo things.");
    const findings = permissionOverreachRule.check(skill, "SKILL.md");
    expect(findings.length).toBe(2);
  });

  it("should not flag safe skill", () => {
    const content = readFileSync(join(__dirname, "../fixtures/safe-skill/SKILL.md"), "utf-8");
    const skill = parseSkillMd(content);
    const findings = permissionOverreachRule.check(skill, "SKILL.md");
    expect(findings.length).toBe(0);
  });

  it("should detect multiple issues in overreach fixture", () => {
    const content = readFileSync(join(__dirname, "../fixtures/overreach/SKILL.md"), "utf-8");
    const skill = parseSkillMd(content);
    const findings = permissionOverreachRule.check(skill, "SKILL.md");
    expect(findings.length).toBeGreaterThanOrEqual(4);
  });
});
