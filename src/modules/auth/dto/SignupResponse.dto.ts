import { createZodDto } from 'nestjs-zod';
import { signupResponseSchema } from '../validation/auth.schemes';

export class SignupResponseDto extends createZodDto(signupResponseSchema) {}
