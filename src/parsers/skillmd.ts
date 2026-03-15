import matter from "gray-matter";
import type { ParsedSkill, SkillMetadata } from "../types.js";

export function parseSkillMd(content: string): ParsedSkill {
  const { data, content: body } = matter(content);
  return {
    metadata: data as SkillMetadata,
    body,
    raw: content,
  };
}
