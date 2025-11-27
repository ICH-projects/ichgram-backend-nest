import { createZodDto } from 'nestjs-zod';
import { signupSchema } from '../validation/auth.schemes';

export class SignupDto extends createZodDto(signupSchema) {}
