import { Injectable } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { Sequelize } from 'sequelize-typescript';
import { JwtService } from '@nestjs/jwt';

import { SignupDto } from './validation/auth.schemes';
import { User } from './models/user.model';
import { MailService } from '../mail/mail.service';


@Injectable()
export class AuthService {
  constructor(
    private sequelize: Sequelize,
    private jwtService: JwtService,
    private mailService: MailService,
  ) {}

  async signup(signupDto: SignupDto) {
    try {
      await this.sequelize.transaction(async (t) => {
        const transactionHost = { transaction: t };
        const passwordHash: string = await bcrypt.hash(signupDto.password, 10);
        await User.create(
          { ...signupDto, password: passwordHash },
          transactionHost,
        );
        const confirmationToken: string = await this.jwtService.signAsync(
          {
            email: signupDto.email,
          },
          { expiresIn: '15m', secret: process.env.JWT_SECRET },
        );

        await this.mailService.sendEmail({
          emailsList: [signupDto.email],
          subject: `Welcome to ${process.env.APP}`,
          template: 'signup-confirmation-email',
          context: {
            name: 'user',
            verificationLink: `${process.env.FRONTEND_BASE_URL}/auth/confirm?token=${confirmationToken}`,
          },
        });
      });
    } catch (error) {
      throw error;
    }
    return `Signup successfully, a message containing a confirmation link has been sent to email: ${signupDto.email}`;
  }
}
