import { createZodDto } from 'nestjs-zod';
import { loginSchema } from '../validation/auth.schemes';

export class LoginDto extends createZodDto(loginSchema) {}
