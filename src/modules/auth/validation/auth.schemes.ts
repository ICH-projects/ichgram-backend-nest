import { object, z } from 'zod';
import { emailPattern, passwordPattern } from './auth.patterns';

export const signupSchema = z
  .object({
    email: z.string().regex(emailPattern.regexp, emailPattern.message),
    password: z.string().regex(passwordPattern.regexp, passwordPattern.message),
  })
  .required();
export type SignupDto = z.infer<typeof signupSchema>;

export const loginSchema = signupSchema.extend({});
export type LoginDto = z.infer<typeof loginSchema>;

export const emailSchema = z
  .object({
    email: z.string().regex(emailPattern.regexp, emailPattern.message),
  })
  .required();
export type EmailDto = z.infer<typeof emailSchema>;

export const passwordSchema = z
  .object({
    password: z.string().regex(passwordPattern.regexp, passwordPattern.message),
  })
  .required();
export type UpdatePasswordDto = z.infer<typeof passwordSchema>;

export const authResponseSchema = z.object({
  payload: z.object({ email: z.string() }).nullable(),
  message: z.string(),
});
export type AuthResponseDto = z.infer<typeof authResponseSchema>;
