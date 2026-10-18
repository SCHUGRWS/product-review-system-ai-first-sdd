import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { describe, expect, it } from "vitest";
import { CLIENT_MESSAGE_PREFIXES } from "./client-messages";
import { isMessageKey } from "./dictionaries";

// Client components only get the messages under CLIENT_MESSAGE_PREFIXES
// (the root layout's <I18nProvider>). This checks every key they ask for is
// covered, and that they never import the full dictionaries.

const ROOT = join(import.meta.dirname, "..");

function sourceFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) return sourceFiles(path);
    return /\.tsx?$/.test(name) && !/\.test\.tsx?$/.test(name) ? [path] : [];
  });
}

const clientFiles = sourceFiles(ROOT).filter((file) =>
  /^\s*["']use client["']/.test(readFileSync(file, "utf8")),
);

const covered = (key: string) =>
  CLIENT_MESSAGE_PREFIXES.some((prefix) => key.startsWith(prefix));

describe("client messages", () => {
  it("finds the client components", () => {
    expect(clientFiles.length).toBeGreaterThan(10);
  });

  it("only uses keys the provider passes to the client", () => {
    const problems: string[] = [];
    for (const file of clientFiles) {
      const source = readFileSync(file, "utf8");
      // t("key"), t(cond ? "a" : "b") and FIELDS labels like label: "auth.x"
      const keys = [
        ...source.matchAll(/["'`]((?:[a-zA-Z]+\.)+[a-zA-Z-]+)["'`]/g),
      ]
        .map((match) => match[1])
        .filter((key) => isMessageKey(key));
      for (const key of keys) {
        if (!covered(key)) problems.push(`${relative(ROOT, file)}: ${key}`);
      }
    }
    expect(problems).toEqual([]);
  });

  it("never imports the dictionaries or the server translator", () => {
    const offenders = clientFiles.filter((file) =>
      /from ["']@\/i18n\/(dictionaries|t|server)["']/.test(
        readFileSync(file, "utf8"),
      ),
    );
    expect(offenders.map((file) => relative(ROOT, file))).toEqual([]);
  });
});
