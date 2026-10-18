import { describe, expect, it } from "vitest";
import { signUpSchema } from "./sign-up.schema";

const valid = {
  firstName: "Ada",
  lastName: "Lovelace",
  email: "ada@example.com",
  password: "supersecret",
  confirmPassword: "supersecret",
};

function fieldErrors(input: unknown) {
  const result = signUpSchema.safeParse(input);
  if (result.success) return {};
  return Object.fromEntries(
    result.error.issues.map((issue) => [issue.path.join("."), issue.message]),
  );
}

describe("signUpSchema", () => {
  it("accepts valid data and normalizes it", () => {
    const data = signUpSchema.parse({
      ...valid,
      firstName: "  Ada ",
      email: " Ada@Example.COM ",
    });
    expect(data.firstName).toBe("Ada");
    expect(data.email).toBe("ada@example.com");
  });

  it("requires first and last name as separate fields", () => {
    expect(fieldErrors({ ...valid, firstName: " ", lastName: "" })).toEqual({
      firstName: "First name is required",
      lastName: "Last name is required",
    });
  });

  it("rejects an invalid email", () => {
    expect(fieldErrors({ ...valid, email: "not-an-email" })).toHaveProperty(
      "email",
    );
  });

  it("rejects a short password", () => {
    expect(
      fieldErrors({ ...valid, password: "short", confirmPassword: "short" }),
    ).toHaveProperty("password");
  });

  it("rejects a password longer than bcrypt supports", () => {
    const long = "a".repeat(73);
    expect(
      fieldErrors({ ...valid, password: long, confirmPassword: long }),
    ).toHaveProperty("password", "Password is too long");
  });

  it("rejects mismatched password confirmation", () => {
    expect(
      fieldErrors({ ...valid, confirmPassword: "different" }),
    ).toHaveProperty("confirmPassword", "Passwords do not match");
  });

  it("rejects missing fields", () => {
    expect(Object.keys(fieldErrors({}))).toEqual(
      expect.arrayContaining([
        "firstName",
        "lastName",
        "email",
        "password",
        "confirmPassword",
      ]),
    );
  });
});
