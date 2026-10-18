import { describe, expect, it } from "vitest";
import { CATEGORY_KEYS } from "@/features/products/categories";
import { dictionaries } from "./dictionaries";
import { en } from "./dictionaries/en";
import { ptBR } from "./dictionaries/pt-BR";

const placeholders = (text: string) =>
  [...text.matchAll(/\{(\w+)\}/g)].map((m) => m[1]).sort();

describe("dictionaries", () => {
  it("pt-BR has exactly the keys of en (also enforced by the Messages type)", () => {
    expect(Object.keys(ptBR).sort()).toEqual(Object.keys(en).sort());
    expect(Object.keys(dictionaries)).toEqual(["en", "pt-BR"]);
  });

  it("has no empty strings", () => {
    for (const dictionary of [en, ptBR]) {
      for (const [key, text] of Object.entries(dictionary)) {
        expect(text.trim(), key).not.toBe("");
      }
    }
  });

  it("uses the same placeholders in both languages", () => {
    for (const key of Object.keys(en) as (keyof typeof en)[]) {
      expect(placeholders(ptBR[key]), key).toEqual(placeholders(en[key]));
    }
  });

  it("has a label for every known Amazon category", () => {
    const keys = Object.keys(en)
      .filter((key) => key.startsWith("category."))
      .map((key) => key.slice("category.".length))
      .sort();
    expect(keys).toEqual([...CATEGORY_KEYS].sort());
  });

  it("writes Portuguese, not English, where the copy is not a name", () => {
    expect(ptBR["landing.title"]).not.toBe(en["landing.title"]);
    expect(ptBR["reviews.giveFeedback"]).toBe("Avaliar");
    expect(ptBR["me.memberSince"]).toBe("Membro desde {date}");
  });
});
