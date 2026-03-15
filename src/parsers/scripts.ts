import { readFileSync } from "node:fs";
import type { ScriptFile } from "../types.js";

const SCRIPT_EXTENSIONS = [".sh", ".bash", ".py", ".js", ".ts", ".rb", ".pl"];

export function isScriptFile(filePath: string): boolean {
  return SCRIPT_EXTENSIONS.some((ext) => filePath.endsWith(ext));
}

export function parseScript(filePath: string): ScriptFile {
  const content = readFileSync(filePath, "utf-8");
  return { path: filePath, content };
}
