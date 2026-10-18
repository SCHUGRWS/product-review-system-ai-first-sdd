import { describe, expect, it } from "vitest";
import { signInSchema } from "./sign-in.schema";

const valid = { email: "ada@example.com", password: "supersecret" };

function fieldErrors(input: unknown) {
  const result = signInSchema.safeParse(input);
  if (result.success) return {};
  return Object.fromEntries(
    result.error.issues.map((issue) => [issue.path.join("."), issue.message]),
  );
}

describe("signInSchema", () => {
  it("normalizes the email like sign-up does", () => {
    const data = signInSchema.parse({ ...valid, email: " Ada@Example.COM " });
    expect(data.email).toBe("ada@example.com");
  });

  it("keeps the password as typed", () => {
    const data = signInSchema.parse({ ...valid, password: " spaced " });
    expect(data.password).toBe(" spaced ");
  });

  it("requires email and password", () => {
    expect(fieldErrors({ email: "", password: "" })).toEqual({
      email: "Email is required",
      password: "Password is required",
    });
    expect(fieldErrors({})).toEqual({
      email: "Email is required",
      password: "Password is required",
    });
  });

  it("rejects an invalid email", () => {
    expect(fieldErrors({ ...valid, email: "not-an-email" })).toEqual({
      email: "Enter a valid email address",
    });
  });

  it("rejects a password longer than bcrypt supports", () => {
    expect(fieldErrors({ ...valid, password: "a".repeat(73) })).toEqual({
      password: "Password is too long",
    });
    // 72 bytes is still accepted, multi-byte characters count as bytes
    expect(fieldErrors({ ...valid, password: "a".repeat(72) })).toEqual({});
    expect(fieldErrors({ ...valid, password: "é".repeat(37) })).toEqual({
      password: "Password is too long",
    });
  });
});
