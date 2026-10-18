import { z } from "zod";

// bcrypt only uses the first 72 bytes of a password
const BCRYPT_MAX_BYTES = 72;

export const NAME_MAX = 100;
export const PASSWORD_MIN = 8;

// Messages are keys of src/i18n/dictionaries: the form shows them in the UI
// language, the REST API in English (src/app/api/v1/_lib/to-response.ts).
const name = (field: "firstName" | "lastName") =>
  z
    .string({ error: `validation.${field}.required` })
    .trim()
    .min(1, `validation.${field}.required`)
    .max(NAME_MAX, `validation.${field}.max`);

export const signUpSchema = z
  .object({
    firstName: name("firstName"),
    lastName: name("lastName"),
    email: z
      .string({ error: "validation.email.required" })
      .trim()
      .toLowerCase()
      .pipe(z.email("validation.email.invalid")),
    password: z
      .string({ error: "validation.password.required" })
      .min(PASSWORD_MIN, "validation.password.min")
      .refine(
        (value) => new TextEncoder().encode(value).length <= BCRYPT_MAX_BYTES,
        "validation.password.tooLong",
      ),
    confirmPassword: z
      .string({ error: "validation.confirmPassword.required" })
      .min(1, "validation.confirmPassword.required"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "validation.confirmPassword.mismatch",
    path: ["confirmPassword"],
  });

export type SignUpInput = z.input<typeof signUpSchema>;
export type SignUpData = z.output<typeof signUpSchema>;
