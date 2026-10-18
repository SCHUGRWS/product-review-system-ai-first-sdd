import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { isAuthorizedImport } from "./import-auth";

describe("isAuthorizedImport", () => {
  beforeEach(() => vi.stubEnv("PRODUCTS_IMPORT_TOKEN", "s3cret-token"));
  afterEach(() => vi.unstubAllEnvs());

  it("accepts the right Bearer token", () => {
    expect(isAuthorizedImport("Bearer s3cret-token")).toBe(true);
  });

  it.each([
    ["Bearer wrong-token"],
    ["Bearer s3cret-token-and-more"],
    ["Bearer "],
    ["Basic s3cret-token"],
    ["s3cret-token"],
    [""],
    [null],
    [undefined],
  ])("rejects %j", (header) => {
    expect(isAuthorizedImport(header)).toBe(false);
  });

  it("fails closed when PRODUCTS_IMPORT_TOKEN is not set", () => {
    vi.stubEnv("PRODUCTS_IMPORT_TOKEN", "");
    expect(isAuthorizedImport("Bearer ")).toBe(false);
    expect(isAuthorizedImport("Bearer s3cret-token")).toBe(false);
    vi.stubEnv("PRODUCTS_IMPORT_TOKEN", undefined);
    expect(isAuthorizedImport("Bearer undefined")).toBe(false);
  });
});
