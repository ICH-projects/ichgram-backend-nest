import { createZodDto } from 'nestjs-zod';
import { emailSchema } from '../validation/auth.schemes';

export class EmailDto extends createZodDto(emailSchema) {}
