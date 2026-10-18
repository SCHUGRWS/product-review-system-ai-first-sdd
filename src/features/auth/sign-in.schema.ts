import { z } from "zod";

// bcrypt only uses the first 72 bytes of a password
const BCRYPT_MAX_BYTES = 72;

// Messages are keys of src/i18n/dictionaries: the form shows them in the UI
// language, the REST API in English (src/app/api/v1/_lib/to-response.ts).
export const signInSchema = z.object({
  // Normalized the same way as on sign-up, so the lookup matches the stored email
  email: z
    .string({ error: "validation.email.required" })
    .trim()
    .toLowerCase()
    .min(1, "validation.email.required")
    .pipe(z.email("validation.email.invalid")),
  password: z
    .string({ error: "validation.password.required" })
    .min(1, "validation.password.required")
    .refine(
      (value) => new TextEncoder().encode(value).length <= BCRYPT_MAX_BYTES,
      "validation.password.tooLong",
    ),
});

export type SignInInput = z.input<typeof signInSchema>;
export type SignInData = z.output<typeof signInSchema>;
