import type { Rule } from "../types.js";
import { promptInjectionRule } from "./prompt-injection.js";
import { permissionOverreachRule } from "./permission-overreach.js";
import { suspiciousUrlsRule } from "./suspicious-urls.js";
import { metadataMismatchRule } from "./metadata-mismatch.js";
import { dataExfiltrationRule } from "./data-exfiltration.js";
import { dangerousCommandsRule } from "./dangerous-commands.js";

export const allRules: Rule[] = [
  promptInjectionRule,
  permissionOverreachRule,
  suspiciousUrlsRule,
  metadataMismatchRule,
  dataExfiltrationRule,
  dangerousCommandsRule,
];

export function getRules(ruleIds?: string[]): Rule[] {
  if (!ruleIds || ruleIds.length === 0) return allRules;
  return allRules.filter((r) => ruleIds.includes(r.id));
}
