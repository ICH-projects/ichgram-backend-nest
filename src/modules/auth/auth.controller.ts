import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  UseGuards,
  UsePipes,
} from '@nestjs/common';
import { signupSchema } from './validation/auth.schemes';
import { SignupDto } from './dto/Signup.dto';
import { AuthService } from './auth.service';
import { ZodValidationPipe } from '../../pipes/ZodValidationPipe';
import {
  ApiBadRequestResponse,
  ApiBody,
  ApiConflictResponse,
  ApiOperation,
  ApiQuery,
  ApiResponse,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { ExceptionResponseDto } from '../../filters/ExceptionResponse.dto';
import { SignupResponseDto } from './dto/SignupResponse.dto';
import { JwtAuthGuard } from './jwt-auth.guard';
import { User } from './decorators/User.decorator';

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
      message:
        'Signup successfully, a message containing a confirmation link has been sent to email: someemail@example.com',
    },
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
  async signup(@Body() signupDto: SignupDto): Promise<SignupResponseDto> {
    const message = await this.authService.signup(signupDto);
    return {
      payload: null,
      message,
    } as SignupResponseDto;
  }

  @ApiOperation({ summary: 'confirm email' })
  @ApiQuery({
    required: true,
    type: String,
    name: 'token',
    example:
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJlbWFpbCI6InpvbG90dWtoaW5wdkBpLnVhIiwiaWF0IjoxNzY0MzU3MjQyLCJleHAiOjE3NjQzNTgxNDJ9.YvEHQMFJvqOs43pCPr74noD5bgNJue4C83cj9dLweRA',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    type: SignupResponseDto,
    description: 'email successfully confirmed.',
    example: {
      payload: null,
      message: 'Email successfully confirmed',
    },
  })
  @ApiUnauthorizedResponse({
    type: SignupResponseDto,
    description: 'token not valid or not exists',
    examples: {
      a: {
        summary: 'token not valid',
        value: {
          statusCode: 401,
          timestamp: '2025-11-28T19:44:42.437Z',
          path: '/v1/api/auth/confirm?token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJlbWFpbCI6InpvbG90dWtoaW5wdkBpLnVhIiwiaWF0IjoxNzY0MzU3MjQyLCJleHAiOjE3NjQzNTgxNDJ9.YvEHQMFJvqOs43pCPr74noD5bgNJue4C83cj9dLweRA',
          message: 'Unauthorized',
        },
      },
      b: {
        summary: 'token is not exists',
        value: {
          statusCode: 401,
          timestamp: '2025-11-28T19:44:42.437Z',
          path: '/v1/api/auth/confirm',
          message: 'Unauthorized',
        },
      },
    },
  })
  @ApiBadRequestResponse({
    type: SignupResponseDto,
    description: 'the token does not belong to the user',
    example: {
      statusCode: 400,
      timestamp: '2025-11-28T19:44:42.437Z',
      path: '/v1/api/auth/confirm?token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJlbWFpbCI6InpvbG90dWtoaW5wdkBpLnVhIiwiaWF0IjoxNzY0MzU3MjQyLCJleHAiOjE3NjQzNTgxNDJ9.YvEHQMFJvqOs43pCPr74noD5bgNJue4C83cj9dLweRA',
      message: 'User with email: wrongEmail@example.com not found',
    },
  })
  @UseGuards(JwtAuthGuard)
  @Get('confirm')
  @HttpCode(HttpStatus.OK)
  async confirmEmail(@User('email') userEmail: string) {
    const message = await this.authService.confirmEmail(userEmail);
    return {
      payload: null,
      message,
    } as SignupResponseDto;
  }
}
