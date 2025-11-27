import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { HttpValidationException } from 'src/exceptions/HttpValidation.exception';
import { ExceptionResponseDto } from './ExceptionResponse.dto';

@Catch(HttpException, HttpValidationException)
export class HttpValidationExceptionFilter implements ExceptionFilter {
  catch(exception: HttpException, host: ArgumentsHost) {
    const response = host.switchToHttp().getResponse<Response>();

    const exceptionDto: ExceptionResponseDto = {
      statusCode: exception.getStatus(),
      timestamp: new Date().toISOString(),
      path: host.switchToHttp().getRequest<Request>().url,
      message: exception.message,
    };

    response.status(exception.getStatus()).json(exceptionDto);
  }
}
