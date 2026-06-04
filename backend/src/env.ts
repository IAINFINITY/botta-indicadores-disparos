import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

function parseValue(rawValue: string): string | number | boolean {
  if (rawValue === "true") return true;
  if (rawValue === "false") return false;

  if (rawValue !== "" && !Number.isNaN(Number(rawValue))) {
    return Number(rawValue);
  }

  return rawValue;
}

function loadEnvCandidate(pathname: string): void {
  if (!existsSync(pathname)) {
    return;
  }

  const content = readFileSync(pathname, "utf8");

  for (const line of content.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;

    const separator = trimmed.indexOf("=");
    if (separator < 0) continue;

    const key = trimmed.slice(0, separator).trim();
    const rawValue = trimmed.slice(separator + 1).trim();

    if (!key || process.env[key] !== undefined) continue;
    process.env[key] = String(parseValue(rawValue));
  }
}

export function loadEnvFile(): void {
  const candidates = [
    resolve(process.cwd(), ".env"),
    resolve(process.cwd(), "..", ".env"),
    resolve(process.cwd(), "..", "..", ".env"),
  ];

  for (const candidate of candidates) {
    loadEnvCandidate(candidate);
  }
}
