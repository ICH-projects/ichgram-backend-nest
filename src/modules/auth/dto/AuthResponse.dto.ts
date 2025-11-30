import { createZodDto } from 'nestjs-zod';
import { authResponseSchema } from '../validation/auth.schemes';

export class AuthResponseDto extends createZodDto(authResponseSchema) {}
