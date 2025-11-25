import { z } from 'zod';
import { emailPattern, passwordPattern } from './auth.patterns';

export const signupSchema = z
  .object({
    email: z.string().regex(emailPattern.regexp, emailPattern.message),
    password: z.string().regex(passwordPattern.regexp, passwordPattern.message),
  })
  .required();

export type SignupDto = z.infer<typeof signupSchema>;
