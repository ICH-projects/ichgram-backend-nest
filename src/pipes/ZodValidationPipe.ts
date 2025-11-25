import { PipeTransform, ArgumentMetadata } from '@nestjs/common';
import { ZodError, ZodType, prettifyError } from 'zod';

import { HttpValidationException } from 'src/exceptions/HttpValidation.exception';

export class ZodValidationPipe<T> implements PipeTransform {
  constructor(private schema: ZodType<T>) {}

  transform(value: unknown, _metadata: ArgumentMetadata) {
    try {
      const parsedValue = this.schema.parse(value);
      return parsedValue;
    } catch (error) {
      if (error instanceof ZodError) {
        throw new HttpValidationException(prettifyError(error));
      }
      throw new HttpValidationException(String(error));
    }
  }
}
