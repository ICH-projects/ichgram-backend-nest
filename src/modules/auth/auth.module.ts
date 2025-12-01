import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';

import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';

import { User } from './models/user.model';
import { Session } from './models/session.model';

import { MailModule } from '../mail/mail.module';
import {
  AccessJwtCookieStrategy,
  JwtParamStrategy,
  RefreshJwtCookieStrategy,
} from './jwt.strategy';

@Module({
  imports: [
    SequelizeModule.forFeature([User, Session]),
    JwtModule.register({
      global: true,
      secret: process.env.JWT_SECRET || 'jwt_secret',
      signOptions: { expiresIn: '1d' },
    }),
    PassportModule,
    MailModule,
  ],
  providers: [
    AuthService,
    JwtParamStrategy,
    AccessJwtCookieStrategy,
    RefreshJwtCookieStrategy,
  ],
  controllers: [AuthController],
})
export class AuthModule {}
