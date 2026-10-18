// next/root-params only exists inside a Next.js request. Tests read the
// [lang] root param from here; setTestLang switches it for one test.
let current = "en";

export async function lang(): Promise<string> {
  return current;
}

export function setTestLang(value: string) {
  current = value;
}
