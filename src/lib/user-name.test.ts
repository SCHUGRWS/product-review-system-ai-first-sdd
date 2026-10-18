import { describe, expect, it } from "vitest";
import { fullName, shortName } from "./user-name";

describe("shortName", () => {
  it("uses the first name and the last name initial", () => {
    expect(shortName({ firstName: "Ada", lastName: "Lovelace" })).toBe(
      "Ada L.",
    );
  });

  it("keeps accented initials", () => {
    expect(shortName({ firstName: "José", lastName: "Álvares" })).toBe(
      "José Á.",
    );
    // "E" followed by a combining acute accent
    expect(shortName({ firstName: "Chloé", lastName: "Étienne" })).toBe(
      "Chloé É.",
    );
  });

  it("handles single-letter and lowercase last names", () => {
    expect(shortName({ firstName: "Joon", lastName: "P" })).toBe("Joon P.");
    expect(shortName({ firstName: "Marta", lastName: "silva" })).toBe(
      "Marta S.",
    );
  });

  it("trims spaces", () => {
    expect(shortName({ firstName: "  Ada ", lastName: "  Lovelace " })).toBe(
      "Ada L.",
    );
  });

  it("falls back to the first name when the last name is blank", () => {
    expect(shortName({ firstName: "Ada", lastName: "   " })).toBe("Ada");
  });
});

describe("fullName", () => {
  it("joins trimmed first and last names", () => {
    expect(fullName({ firstName: " Ada ", lastName: " Lovelace" })).toBe(
      "Ada Lovelace",
    );
  });
});
