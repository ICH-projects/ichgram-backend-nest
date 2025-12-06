import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { Sequelize } from 'sequelize-typescript';
import { JwtService } from '@nestjs/jwt';
import { InjectModel } from '@nestjs/sequelize';

import { User } from './models/user.model';
import { MailService } from '../mail/mail.service';

import { LoginDto } from './dto/Login.dto';
import { SignupDto } from './dto/Signup.dto';

import { Session } from './models/session.model';
import { MAIL_TYPES, mailTemplates } from './constants/MailTypes';

@Injectable()
export class AuthService {
  constructor(
    private readonly sequelize: Sequelize,
    private readonly jwtService: JwtService,
    private readonly mailService: MailService,
    @InjectModel(User) private userRepository: typeof User,
  ) {}

  async signup(signupDto: SignupDto): Promise<string> {
    try {
      await this.sequelize.transaction(async (t) => {
        const transactionHost = { transaction: t };
        const passwordHash: string = await bcrypt.hash(signupDto.password, 10);
        await this.userRepository.create(
          { ...signupDto, password: passwordHash },
          transactionHost,
        );
        const { confirmationToken } = await this.createToken({
          email: signupDto.email,
        });

        await this.sendConfirmationEmail(
          [signupDto.email],
          confirmationToken,
          MAIL_TYPES.SignupConfirmation,
        );
      });
    } catch (error) {
      throw error;
    }
    return `Signup successfully, a message containing a confirmation link has been sent to email: ${signupDto.email}`;
  }

  async confirmEmail(email: string): Promise<string> {
    const user = await User.findOne({ where: { email } });
    if (!user)
      throw new HttpException(
        `User with email: ${email} not found`,
        HttpStatus.BAD_REQUEST,
      );
    await user.update({ isConfirmed: true });
    return `Email successfully confirmed`;
  }

  async login(
    loginDto: LoginDto,
  ): Promise<{ accessToken: string; refreshToken: string }> {
    const user: User | null = await User.findOne({
      where: { email: loginDto.email },
    });
    if (!user)
      throw new HttpException(
        'Email or password invalid',
        HttpStatus.NOT_FOUND,
      );

    const isPasswordValid = await bcrypt.compare(
      loginDto.password,
      user.password,
    );
    if (!isPasswordValid)
      throw new HttpException(
        'Email or password invalid',
        HttpStatus.NOT_FOUND,
      );

    if (!user.isConfirmed) {
      const { confirmationToken } = await this.createToken({
        email: loginDto.email,
      });

      await this.sendConfirmationEmail(
        [loginDto.email],
        confirmationToken,
        MAIL_TYPES.SignupConfirmation,
      );

      throw new HttpException(
        `Email not confirmed, a message containing a confirmation link has been sent to email: ${loginDto.email}`,
        HttpStatus.FORBIDDEN,
      );
    }

    await Session.destroy({ where: { userId: user.id } });

    const { accessToken, refreshToken } = await this.createToken({
      email: user.email,
    });

    await Session.create({ userId: user.id, accessToken, refreshToken });

    return { accessToken, refreshToken };
  }

  async logout(email: string): Promise<void> {
    const user = await User.findOne({ where: { email } });
    if (!user)
      throw new HttpException(
        `User with email: ${email} not found`,
        HttpStatus.NOT_FOUND,
      );
    await Session.destroy({ where: { userId: user.id } });
  }

  async refreshTokens(email: string) {
    const user = await User.findOne({ where: { email } });
    if (!user)
      throw new HttpException(
        `User with email: ${email} not found`,
        HttpStatus.NOT_FOUND,
      );
    await Session.destroy({ where: { userId: user.id } });
    const { accessToken, refreshToken } = await this.createToken({
      email: user.email,
    });
    await Session.create({ userId: user.id, accessToken, refreshToken });
    return { accessToken, refreshToken };
  }

  async resetPassword(email: string): Promise<string> {
    const user = await User.findOne({ where: { email } });
    if (!user)
      throw new HttpException(
        `User with email: ${email} not found`,
        HttpStatus.NOT_FOUND,
      );
    const { confirmationToken } = await this.createToken({ email });

    await this.sendConfirmationEmail(
      [email],
      confirmationToken,
      MAIL_TYPES.ResetPasswordConfirmation,
    );

    return `Reset password. A message containing a confirmation link has been sent to email: ${email}`;
  }

  async updatePassword(email: string, newPassword: string): Promise<string> {
    const user = await User.findOne({ where: { email } });
    if (!user)
      throw new HttpException(
        `User with email: ${email} not found`,
        HttpStatus.NOT_FOUND,
      );
    const passwordHash: string = await bcrypt.hash(newPassword, 10);

    await user.update({ password: passwordHash });
    return `Password successfully updated`;
  }

  async deleteUser(userEmail: string): Promise<string> {
    const user = await User.findOne({ where: { email: userEmail } });
    if (!user)
      throw new HttpException(
        `User with email: ${userEmail} not found`,
        HttpStatus.BAD_REQUEST,
      );
    await user.destroy();
    return `User successfully deleted`;
  }

  private async createToken(payload: Record<string, string>) {
    const accessToken: string = await this.jwtService.signAsync(payload, {
      expiresIn: '60m',
      secret: process.env.JWT_SECRET,
    });
    const refreshToken: string = await this.jwtService.signAsync(payload, {
      expiresIn: '7d',
      secret: process.env.JWT_SECRET,
    });
    const confirmationToken: string = await this.jwtService.signAsync(payload, {
      expiresIn: '15m',
      secret: process.env.JWT_SECRET,
    });
    return { confirmationToken, accessToken, refreshToken };
  }

  private async sendConfirmationEmail(
    emailsList: string[],
    confirmationToken: string,
    emailType: MAIL_TYPES,
  ) {
    await this.mailService.sendEmail({
      emailsList,
      subject: `Welcome to ${process.env.APP}`,
      template: mailTemplates[emailType].template,
      context: {
        name: 'user',
        verificationLink: `${process.env.FRONTEND_BASE_URL}/${mailTemplates[emailType].link}?token=${confirmationToken}`,
      },
    });
  }
}
