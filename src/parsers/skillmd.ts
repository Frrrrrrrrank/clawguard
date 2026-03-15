import matter from "gray-matter";
import type { ParsedSkill, SkillMetadata } from "../types.js";

export function parseSkillMd(content: string): ParsedSkill {
  try {
    const { data, content: body } = matter(content);
    return {
      metadata: data as SkillMetadata,
      body,
      raw: content,
    };
  } catch {
    // If frontmatter parsing fails, treat entire content as body
    return {
      metadata: {},
      body: content,
      raw: content,
    };
  }
}
