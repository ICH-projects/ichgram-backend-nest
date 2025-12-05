import {
  Body,
  Controller,
  Get,
  Header,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  Res,
  UseGuards,
  UsePipes,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBody,
  ApiConflictResponse,
  ApiCookieAuth,
  ApiForbiddenResponse,
  ApiHeader,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiQuery,
  ApiResponse,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';

import {
  loginSchema,
  signupSchema,
  passwordSchema,
  emailSchema,
} from './validation/auth.schemes';
import { SignupDto } from './dto/Signup.dto';
import { LoginDto } from './dto/Login.dto';
import { AuthResponseDto } from './dto/AuthResponse.dto';

import { ZodValidationPipe } from '../../pipes/ZodValidationPipe';
import { ExceptionResponseDto } from '../../filters/ExceptionResponse.dto';
import {
  AccessJwtAuthGuard,
  RefreshJwtAuthGuard,
  ParamJwtAuthGuard,
} from './jwt-auth.guard';

import { User } from './decorators/User.decorator';

import { AuthService } from './auth.service';
import type { Response } from 'express';
import { UpdatePasswordDto } from './dto/UpdatePassword.dto';
import { EmailDto } from './dto/Email.dto';

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
    type: AuthResponseDto,
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
    type: ExceptionResponseDto,
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
  async signup(@Body() signupDto: SignupDto): Promise<AuthResponseDto> {
    const message = await this.authService.signup(signupDto);
    return {
      payload: null,
      message,
    } as AuthResponseDto;
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
    type: AuthResponseDto,
    description: 'email successfully confirmed.',
    example: {
      payload: null,
      message: 'Email successfully confirmed',
    },
  })
  @ApiUnauthorizedResponse({
    type: ExceptionResponseDto,
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
    type: ExceptionResponseDto,
    description: 'the token does not belong to the user',
    example: {
      statusCode: 400,
      timestamp: '2025-11-28T19:44:42.437Z',
      path: '/v1/api/auth/confirm?token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJlbWFpbCI6InpvbG90dWtoaW5wdkBpLnVhIiwiaWF0IjoxNzY0MzU3MjQyLCJleHAiOjE3NjQzNTgxNDJ9.YvEHQMFJvqOs43pCPr74noD5bgNJue4C83cj9dLweRA',
      message: 'User with email: wrongEmail@example.com not found',
    },
  })
  @UseGuards(ParamJwtAuthGuard)
  @Get('confirm-email')
  @HttpCode(HttpStatus.OK)
  async confirmEmail(@User('email') userEmail: string) {
    const message = await this.authService.confirmEmail(userEmail);
    return {
      payload: null,
      message,
    } as AuthResponseDto;
  }

  @ApiOperation({ summary: 'login user' })
  @ApiBody({
    type: [LoginDto],
    required: true,
    examples: {
      a: {
        summary: 'Example with valid body',
        value: {
          email: 'someemail@example.com',
          password: 'passWord1%',
        } as LoginDto,
      },
    },
  })
  @ApiOkResponse({
    type: AuthResponseDto,
    description: 'login successfully.',
    headers: {
      'Set-Cookie': {
        description: 'access token',
        schema: {
          type: 'string',
          example:
            'accessToken=V7wmyyuivzpbnkhYEc5_SmyjN53ZZQ6EnCQZRjI; Max-Age=3600; Path=/; Expires=Tue, 02 Dec 2025 17:40:51 GMT; HttpOnly; SameSite=Lax\n' +
            'refreshToken=V7wmyyuivzpbnkhYEc5_SmyjN53ZZQ6EnCQZRjI; Max-Age=3600; Path=/; Expires=Tue, 02 Dec 2025 17:40:51 GMT; HttpOnly; SameSite=Lax\n',
        },
      },
    },
    example: {
      payload: { email: 'someemail@example.com' },
      message: 'Login successfully',
    },
  })
  @ApiBadRequestResponse({
    type: ExceptionResponseDto,
    description: 'Fail when request body invalid',
    examples: {
      a: {
        summary: 'request body is empty',
        value: {
          statusCode: HttpStatus.BAD_REQUEST,
          timestamp: new Date().toISOString(),
          path: '/api/auth/login',
          message: 'Invalid input: expected object, received undefined',
        },
      },
      b: {
        summary: 'email format is invalid',
        value: {
          statusCode: HttpStatus.BAD_REQUEST,
          timestamp: new Date().toISOString(),
          path: '/api/auth/login',
          message: 'Please enter a valid email address',
        },
      },
      c: {
        summary: 'password is too short',
        value: {
          statusCode: HttpStatus.BAD_REQUEST,
          timestamp: new Date().toISOString(),
          path: '/api/auth/login',
          message: 'Minimum length: ...',
        },
      },
      d: {
        summary: 'password does not meet complexity requirements',
        value: {
          statusCode: HttpStatus.BAD_REQUEST,
          timestamp: new Date().toISOString(),
          path: '/api/auth/login',
          message: 'Password must contain ...',
        },
      },
    },
  })
  @ApiNotFoundResponse({
    type: ExceptionResponseDto,
    description: 'Fail when user not found',
    example: {
      statusCode: HttpStatus.NOT_FOUND,
      timestamp: new Date().toISOString(),
      path: '/api/auth/login',
      message: 'Email or password invalid',
    },
  })
  @ApiForbiddenResponse({
    type: ExceptionResponseDto,
    description: 'Fail when user email not confirmed',
    example: {
      statusCode: HttpStatus.FORBIDDEN,
      timestamp: new Date().toISOString(),
      path: '/api/auth/login',
      message:
        'Email not confirmed, a message containing a confirmation link has been sent to email: someemail@example.com',
    },
  })
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @UsePipes(new ZodValidationPipe(loginSchema))
  async login(
    @Body() loginDto: LoginDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const { accessToken, refreshToken } =
      await this.authService.login(loginDto);
    this.setAuthCookies(res, accessToken, refreshToken);
    return {
      payload: null,
      message: 'Login successfully',
    } as AuthResponseDto;
  }

  @ApiOperation({
    summary: 'logout user',
    description:
      'logout user and clear tokens (accessToken, refreshToken) if valid accessToken exists in cookie',
  })
  @ApiCookieAuth('accessToken')
  @ApiOkResponse({
    type: AuthResponseDto,
    description: 'logout successfully.',
    example: {
      payload: null,
      message: 'Logout successfully',
    },
  })
  @ApiNotFoundResponse({
    type: ExceptionResponseDto,
    description: 'Fail when user not found',
    example: {
      statusCode: HttpStatus.NOT_FOUND,
      timestamp: new Date().toISOString(),
      path: '/api/auth/logout',
      message: 'User with email: someemail@example.com not found',
    },
  })
  @ApiUnauthorizedResponse({
    type: ExceptionResponseDto,
    description: 'token not valid or not exists',
    examples: {
      a: {
        summary: 'token not valid',
        value: {
          statusCode: 401,
          timestamp: '2025-11-28T19:44:42.437Z',
          path: '/v1/api/auth/logout',
          message: 'Unauthorized',
        },
      },
      b: {
        summary: 'token is not exists',
        value: {
          statusCode: 401,
          timestamp: '2025-11-28T19:44:42.437Z',
          path: '/v1/api/auth/logout',
          message: 'Unauthorized',
        },
      },
    },
  })
  @Get('logout')
  @HttpCode(HttpStatus.OK)
  @UseGuards(new AccessJwtAuthGuard('access_jwt_cookie'))
  async logout(
    @User('email') userEmail: string,
    @Res({ passthrough: true }) res: Response,
  ) {
    await this.authService.logout(userEmail);
    this.clearAuthCookies(res);
    return {
      payload: null,
      message: 'Logout successfully',
    } as AuthResponseDto;
  }

  @ApiOperation({
    summary: 'refresh tokens',
    description:
      'refresh tokens (accessToken, refreshToken) if valid refreshToken exists in cookie',
  })
  @ApiCookieAuth('refreshToken')
  @ApiOkResponse({
    type: AuthResponseDto,
    description: 'Tokens successfully updated.',
    example: {
      payload: null,
      message: 'Tokens successfully updated',
    },
    headers: {
      'Set-Cookie': {
        description: 'access token',
        schema: {
          type: 'string',
          example:
            'accessToken=V7wmyyuivzpbnkhYEc5_SmyjN53ZZQ6EnCQZRjI; Max-Age=3600; Path=/; Expires=Tue, 02 Dec 2025 17:40:51 GMT; HttpOnly; SameSite=Lax\n' +
            'refreshToken=V7wmyyuivzpbnkhYEc5_SmyjN53ZZQ6EnCQZRjI; Max-Age=3600; Path=/; Expires=Tue, 02 Dec 2025 17:40:51 GMT; HttpOnly; SameSite=Lax\n',
        },
      },
    },
  })
  @ApiNotFoundResponse({
    type: ExceptionResponseDto,
    description: 'Fail when user not found',
    example: {
      statusCode: HttpStatus.NOT_FOUND,
      timestamp: new Date().toISOString(),
      path: '/api/auth/refresh',
      message: 'User with email: someemail@example.com not found',
    },
  })
  @ApiUnauthorizedResponse({
    type: ExceptionResponseDto,
    description: 'token not valid or not exists',
    examples: {
      a: {
        summary: 'token not valid',
        value: {
          statusCode: 401,
          timestamp: '2025-11-28T19:44:42.437Z',
          path: '/v1/api/auth/refresh',
          message: 'Unauthorized',
        },
      },
      b: {
        summary: 'token is not exists',
        value: {
          statusCode: 401,
          timestamp: '2025-11-28T19:44:42.437Z',
          path: '/v1/api/auth/refresh',
          message: 'Unauthorized',
        },
      },
    },
  })
  @Get('refresh')
  @HttpCode(HttpStatus.OK)
  @UseGuards(new RefreshJwtAuthGuard('refresh_jwt_cookie'))
  async refresh(
    @User('email') userEmail: string,
    @Res({ passthrough: true }) res: Response,
  ) {
    const { accessToken, refreshToken } =
      await this.authService.refreshTokens(userEmail);
    this.setAuthCookies(res, accessToken, refreshToken);
    return {
      payload: null,
      message: 'Tokens successfully updated',
    } as AuthResponseDto;
  }

  @ApiOperation({
    summary: 'request to reset password',
  })
  @ApiBody({
    type: [EmailDto],
    required: true,
    examples: {
      a: {
        summary: 'Example with valid body',
        value: {
          email: 'someemail@example.com',
        } as EmailDto,
      },
    },
  })
  @ApiNotFoundResponse({
    type: ExceptionResponseDto,
    description: 'Fail when user not found',
    example: {
      statusCode: HttpStatus.NOT_FOUND,
      timestamp: new Date().toISOString(),
      path: '/api/auth/reset-password',
      message: 'User with email: someemail@example.com not found',
    },
  })
  @ApiBadRequestResponse({
    type: ExceptionResponseDto,
    description: 'Fail when request body invalid',
    examples: {
      a: {
        summary: 'request body is empty',
        value: {
          statusCode: HttpStatus.BAD_REQUEST,
          timestamp: new Date().toISOString(),
          path: '/api/auth/reset-password',
          message: 'Invalid input: expected object, received undefined',
        },
      },
      b: {
        summary: 'email format is invalid',
        value: {
          statusCode: HttpStatus.BAD_REQUEST,
          timestamp: new Date().toISOString(),
          path: '/api/auth/reset-password',
          message: 'Please enter a valid email address',
        },
      },
    },
  })
  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  @UsePipes(new ZodValidationPipe(emailSchema))
  async resetPassword(@Body() emailDto: EmailDto) {
    const message = await this.authService.resetPassword(emailDto.email);
    return {
      payload: null,
      message,
    } as AuthResponseDto;
  }
  private setAuthCookies(
    res: Response,
    accessToken: string,
    refreshToken: string,
  ) {
    res
      .cookie('accessToken', accessToken, {
        httpOnly: true,
        path: '/',
        maxAge: 60 * 60 * 1000,
        sameSite: 'lax',
      })
      .cookie('refreshToken', refreshToken, {
        httpOnly: true,
        path: '/',
        maxAge: 7 * 24 * 60 * 60 * 1000,
        sameSite: 'lax',
      });
  }
  private clearAuthCookies(res: Response) {
    res.clearCookie('accessToken').clearCookie('refreshToken');
  }
}
