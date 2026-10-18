import { z } from "zod";

// bcrypt only uses the first 72 bytes of a password
const BCRYPT_MAX_BYTES = 72;

const required = (label: string) => ({ error: `${label} is required` });

const name = (label: string) =>
  z
    .string(required(label))
    .trim()
    .min(1, `${label} is required`)
    .max(100, `${label} must have at most 100 characters`);

export const signUpSchema = z
  .object({
    firstName: name("First name"),
    lastName: name("Last name"),
    email: z
      .string(required("Email"))
      .trim()
      .toLowerCase()
      .pipe(z.email("Enter a valid email address")),
    password: z
      .string(required("Password"))
      .min(8, "Password must have at least 8 characters")
      .refine(
        (value) => new TextEncoder().encode(value).length <= BCRYPT_MAX_BYTES,
        "Password is too long",
      ),
    confirmPassword: z
      .string({ error: "Confirm your password" })
      .min(1, "Confirm your password"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export type SignUpInput = z.input<typeof signUpSchema>;
export type SignUpData = z.output<typeof signUpSchema>;
