
import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class ParamJwtAuthGuard extends AuthGuard('jwt_param') {}

@Injectable()
export class AccessJwtAuthGuard extends AuthGuard('access_jwt_cookie') {}

@Injectable()
export class RefreshJwtAuthGuard extends AuthGuard('refresh_jwt_cookie') {}
