import { createZodDto } from 'nestjs-zod';
import { passwordSchema } from '../validation/auth.schemes';

export class UpdatePasswordDto extends createZodDto(passwordSchema) {}
