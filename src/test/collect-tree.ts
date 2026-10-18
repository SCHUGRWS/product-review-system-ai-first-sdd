import { isValidElement } from "react";

export type FoundElement = { type: unknown; props: Record<string, unknown> };

/**
 * Walks the element tree returned by a Server Component without React DOM:
 * function components are called (async ones awaited) so their markup is
 * visible; components using hooks (client ones) throw outside React and are
 * left unexpanded, as are the ones in `skip`. Redirects and notFound() (errors
 * with a digest) propagate. Collects every element and every string.
 */
export async function collectTree(
  node: unknown,
  { skip = [] }: { skip?: unknown[] } = {},
) {
  const elements: FoundElement[] = [];
  const strings: string[] = [];
  const visit = async (value: unknown, depth: number): Promise<void> => {
    if (depth > 80 || value == null || typeof value === "boolean") return;
    if (typeof value === "string" || typeof value === "number") {
      strings.push(String(value));
    } else if (Array.isArray(value)) {
      for (const item of value) await visit(item, depth + 1);
    } else if (value instanceof Promise) {
      await visit(await value, depth + 1);
    } else if (isValidElement(value)) {
      const props = value.props as Record<string, unknown>;
      elements.push({ type: value.type, props });
      for (const prop of Object.values(props)) await visit(prop, depth + 1);
      if (typeof value.type === "function" && !skip.includes(value.type)) {
        let rendered: unknown;
        try {
          rendered = await (value.type as (p: unknown) => unknown)(props);
        } catch (error) {
          if (error && typeof error === "object" && "digest" in error) {
            throw error;
          }
          // Hooks outside React: a client component, left unexpanded
          return;
        }
        await visit(rendered, depth + 1);
      }
    }
  };
  await visit(node, 0);
  return { elements, strings, text: strings.join("\n") };
}
