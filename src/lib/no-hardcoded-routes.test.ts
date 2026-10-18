import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { describe, expect, it } from "vitest";

// Every page lives under /<locale>/ (specs/i18n.md), so links and redirects
// go through localeHref / LocalizedLink (src/lib/routes.ts). This scan fails
// on literal app paths such as href="/home" or router.push("/me").

const ROOT = join(import.meta.dirname, "..");
const SCANNED = ["app", "features", "components"].map((dir) => join(ROOT, dir));

function sourceFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) return sourceFiles(path);
    return /\.tsx?$/.test(name) && !/\.test\.tsx?$/.test(name) ? [path] : [];
  });
}

// A string literal starting with one slash (not "//" or a full URL) right
// after href=, action=, push(, replace( or redirect(
const HARDCODED =
  /(?:\bhref=\{?|\baction=\{?|\.push\(|\.replace\(|\bredirect\()\s*["'`]\/(?!\/)/g;

describe("no hard-coded routes", () => {
  const files = SCANNED.flatMap(sourceFiles).filter(
    (file) => !file.includes(`${join("app", "api")}`),
  );

  it("scans the pages, features and components", () => {
    expect(files.length).toBeGreaterThan(40);
  });

  it("links and redirects only through the locale helpers", () => {
    const offenders = files.flatMap((file) => {
      const source = readFileSync(file, "utf8");
      return [...source.matchAll(HARDCODED)].map(
        (match) => `${relative(ROOT, file)}: ${match[0]}`,
      );
    });
    expect(offenders).toEqual([]);
  });

  it("catches the patterns it is meant to", () => {
    for (const sample of [
      '<Link href="/home">',
      "<a href={'/me'}>",
      "router.push(`/auth/sign-in`)",
      'redirect("/home")',
      '<Form action="/home">',
    ]) {
      expect(sample.match(HARDCODED), sample).not.toBeNull();
    }
    for (const sample of [
      'href="https://github.com"',
      "href={homeHref(locale)}",
      'href="//cdn.example.com"',
    ]) {
      expect(sample.match(HARDCODED), sample).toBeNull();
    }
  });
});
