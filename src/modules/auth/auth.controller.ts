import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  UsePipes,
} from '@nestjs/common';
import { type SignupDto, signupSchema } from './validation/auth.schemes';
import { AuthService } from './auth.service';
import { ZodValidationPipe } from '../../pipes/ZodValidationPipe';

@Controller('api/auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('signup')
  @HttpCode(HttpStatus.CREATED)
  @UsePipes(new ZodValidationPipe(signupSchema))
  signup(@Body() signupDto: SignupDto) {
    return this.authService.signup(signupDto);
  }
}
