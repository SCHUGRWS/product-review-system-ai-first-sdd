import { afterEach, describe, expect, it } from "vitest";
import { greeting, memberSince } from "./me.utils";

describe("greeting", () => {
  it("uses the first name", () => {
    expect(greeting({ firstName: " Ada " })).toBe("Welcome back, Ada");
  });
});

describe("memberSince", () => {
  const originalTz = process.env.TZ;
  afterEach(() => {
    process.env.TZ = originalTz;
  });

  it("formats month and year", () => {
    expect(memberSince(new Date("2026-10-17T12:00:00Z"))).toBe(
      "Member since October 2026",
    );
  });

  it("does not shift the month at UTC boundaries", () => {
    // In New York this instant is still September 30th
    process.env.TZ = "America/New_York";
    expect(memberSince(new Date("2026-10-01T00:30:00Z"))).toBe(
      "Member since October 2026",
    );
    // In Tokyo the last evening of the month (UTC) is already the 1st
    process.env.TZ = "Asia/Tokyo";
    expect(memberSince(new Date("2026-09-30T23:30:00Z"))).toBe(
      "Member since September 2026",
    );
  });

  it("handles the year boundary", () => {
    process.env.TZ = "America/Los_Angeles";
    expect(memberSince(new Date("2027-01-01T03:00:00Z"))).toBe(
      "Member since January 2027",
    );
  });
});
