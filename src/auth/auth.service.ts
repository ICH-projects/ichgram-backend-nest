import { Injectable } from '@nestjs/common';

import { SignupDto } from './validation/auth.schemes';
import { User } from './models/user.model';

@Injectable()
export class AuthService {
  async signup(signupDto: SignupDto) {
    const createdUser = await User.create(signupDto);
    console.log(createdUser);
    return `Signup successfully, a message containing a confirmation link has been sent to email: ${signupDto.email}`;
  }
}
