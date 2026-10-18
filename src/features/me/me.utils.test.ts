import { afterEach, describe, expect, it } from "vitest";
import { createT } from "@/i18n/t";
import { greeting, memberSince } from "./me.utils";

const t = createT("en");

describe("greeting", () => {
  it("uses the first name", () => {
    expect(greeting(t, { firstName: " Ada " })).toBe("Welcome back, Ada");
  });
});

describe("in Portuguese", () => {
  it("greets and formats the month in Portuguese", () => {
    const pt = createT("pt-BR");
    expect(greeting(pt, { firstName: "Ada" })).toBe("Olá de novo, Ada");
    expect(memberSince(pt, "pt-BR", new Date("2026-10-17T12:00:00Z"))).toBe(
      "Membro desde outubro de 2026",
    );
  });
});

describe("memberSince", () => {
  const originalTz = process.env.TZ;
  afterEach(() => {
    process.env.TZ = originalTz;
  });

  it("formats month and year", () => {
    expect(memberSince(t, "en", new Date("2026-10-17T12:00:00Z"))).toBe(
      "Member since October 2026",
    );
  });

  it("does not shift the month at UTC boundaries", () => {
    // In New York this instant is still September 30th
    process.env.TZ = "America/New_York";
    expect(memberSince(t, "en", new Date("2026-10-01T00:30:00Z"))).toBe(
      "Member since October 2026",
    );
    // In Tokyo the last evening of the month (UTC) is already the 1st
    process.env.TZ = "Asia/Tokyo";
    expect(memberSince(t, "en", new Date("2026-09-30T23:30:00Z"))).toBe(
      "Member since September 2026",
    );
  });

  it("handles the year boundary", () => {
    process.env.TZ = "America/Los_Angeles";
    expect(memberSince(t, "en", new Date("2027-01-01T03:00:00Z"))).toBe(
      "Member since January 2027",
    );
  });
});
