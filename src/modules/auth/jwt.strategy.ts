import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable } from '@nestjs/common';
import {
  accessTokenExtractor,
  refreshTokenExtractor,
} from './utils/cookie-extractor';

@Injectable()
export class JwtParamStrategy extends PassportStrategy(Strategy, 'jwt_param') {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromUrlQueryParameter('token'),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET || 'jwt_secret',
    });
  }

  async validate(payload: any) {
    return { email: payload.email };
  }
}

@Injectable()
export class AccessJwtCookieStrategy extends PassportStrategy(
  Strategy,
  'access_jwt_cookie',
) {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([accessTokenExtractor]),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET || 'jwt_secret',
    });
  }

  async validate(payload: any) {
    return { email: payload.email };
  }
}

@Injectable()
export class RefreshJwtCookieStrategy extends PassportStrategy(
  Strategy,
  'refresh_jwt_cookie',
) {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([refreshTokenExtractor]),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET || 'jwt_secret',
    });
  }

  async validate(payload: any) {
    return { email: payload.email };
  }
}
