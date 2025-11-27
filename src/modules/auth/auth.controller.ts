import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  UsePipes,
  Version,
} from '@nestjs/common';
import { signupSchema } from './validation/auth.schemes';
import { SignupDto } from './dto/Signup.dto';
import { AuthService } from './auth.service';
import { ZodValidationPipe } from '../../pipes/ZodValidationPipe';
import {
  ApiBadRequestResponse,
  ApiBody,
  ApiConflictResponse,
  ApiOkResponse,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { ExceptionResponseDto } from '../../filters/ExceptionResponse.dto';
import { SignupResponseDto } from './dto/SignupResponse.dto';

@ApiTags('Auth')
@Controller({ path: 'api/auth', version: '1' })
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @ApiOperation({ summary: 'signup user' })
  @ApiBody({
    type: [SignupDto],
    required: true,
    examples: {
      a: {
        summary: 'Example with valid body',
        value: {
          email: 'someemail@example.com',
          password: 'passWord1%',
        } as SignupDto,
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    type: SignupResponseDto,
    description: 'The record has been successfully created.',
    example: {
      payload: null,
      meta: {
        message:
          'Signup successfully, a message containing a confirmation link has been sent to email: someemail@example.com',
      },
    } ,
  })
  @ApiConflictResponse({
    type: ExceptionResponseDto,
    description: 'Fail when a duplicate email',
    example: {
      statusCode: HttpStatus.CONFLICT,
      timestamp: new Date().toISOString(),
      path: '/api/auth/signup',
      message: 'email must be unique',
    },
  })
  @ApiBadRequestResponse({
    description: 'Fail when request body invalid',
    examples: {
      a: {
        summary: 'request body is empty',
        value: {
          statusCode: HttpStatus.BAD_REQUEST,
          timestamp: new Date().toISOString(),
          path: '/api/auth/signup',
          message: 'Invalid input: expected object, received undefined',
        },
      },
      b: {
        summary: 'email format is invalid',
        value: {
          statusCode: HttpStatus.BAD_REQUEST,
          timestamp: new Date().toISOString(),
          path: '/api/auth/signup',
          message: 'Please enter a valid email address',
        },
      },
      c: {
        summary: 'password is too short',
        value: {
          statusCode: HttpStatus.BAD_REQUEST,
          timestamp: new Date().toISOString(),
          path: '/api/auth/signup',
          message: 'Minimum length: ...',
        },
      },
      d: {
        summary: 'password does not meet complexity requirements',
        value: {
          statusCode: HttpStatus.BAD_REQUEST,
          timestamp: new Date().toISOString(),
          path: '/api/auth/signup',
          message: 'Password must contain ...',
        },
      },
    },
  })
  @Post('signup')
  @HttpCode(HttpStatus.CREATED)
  @UsePipes(new ZodValidationPipe(signupSchema))
  async signup(
    @Body() signupDto: SignupDto,
  ): Promise<SignupResponseDto> {
    const message = await this.authService.signup(signupDto);
    return {
      payload: null,
      meta: { message: message },
    } as SignupResponseDto;
  }
}
