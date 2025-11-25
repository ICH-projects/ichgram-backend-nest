import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { SequelizeModule } from '@nestjs/sequelize';
import { User } from './models/user.model';
import { Session } from './models/session.model';

@Module({
  imports: [SequelizeModule.forFeature([User, Session])],
  providers: [AuthService],
  controllers: [AuthController],
})
export class AuthModule {}
