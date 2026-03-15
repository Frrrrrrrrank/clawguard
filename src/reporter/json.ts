import { writeFileSync } from "node:fs";
import type { ScanResult } from "../types.js";

export function reportJson(results: ScanResult[], outputPath?: string): void {
  const json = JSON.stringify(results, null, 2);
  if (outputPath) {
    writeFileSync(outputPath, json, "utf-8");
  } else {
    console.log(json);
  }
}
