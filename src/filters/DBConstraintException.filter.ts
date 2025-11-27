import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpStatus,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { UniqueConstraintError } from 'sequelize';
import { ExceptionResponseDto } from './ExceptionResponse.dto';

@Catch(UniqueConstraintError)
export class DBConstraintExceptionFilter implements ExceptionFilter {
  catch(exception: UniqueConstraintError, host: ArgumentsHost) {
    const response = host.switchToHttp().getResponse<Response>();

    const exceptionDto: ExceptionResponseDto = {
      statusCode: HttpStatus.CONFLICT,
      timestamp: new Date().toISOString(),
      path: host.switchToHttp().getRequest<Request>().url,
      message: exception.errors.map(({ message }) => message).join(';\n'),
    };

    response.status(HttpStatus.CONFLICT).json(exceptionDto);
  }
}
