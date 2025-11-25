import { Injectable } from '@nestjs/common';

@Injectable()
export class AuthService {
  signup(email: string) {
    return `Signup successfully, a message containing a confirmation link has been sent to email: ${email}`;
  }
}
