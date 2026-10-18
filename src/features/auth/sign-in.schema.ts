import { z } from "zod";

// bcrypt only uses the first 72 bytes of a password
const BCRYPT_MAX_BYTES = 72;

export const signInSchema = z.object({
  // Normalized the same way as on sign-up, so the lookup matches the stored email
  email: z
    .string({ error: "Email is required" })
    .trim()
    .toLowerCase()
    .min(1, "Email is required")
    .pipe(z.email("Enter a valid email address")),
  password: z
    .string({ error: "Password is required" })
    .min(1, "Password is required")
    .refine(
      (value) => new TextEncoder().encode(value).length <= BCRYPT_MAX_BYTES,
      "Password is too long",
    ),
});

export type SignInInput = z.input<typeof signInSchema>;
export type SignInData = z.output<typeof signInSchema>;
