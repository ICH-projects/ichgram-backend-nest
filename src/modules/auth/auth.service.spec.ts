import { Test, TestingModule } from '@nestjs/testing';
import { Sequelize } from 'sequelize-typescript';
import { JwtService } from '@nestjs/jwt';

import { AuthService } from './auth.service';
import { SignupDto } from './validation/auth.schemes';
import { MailService } from '../mail/mail.service';

describe('AuthService', () => {
  let service: AuthService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [AuthService],
    })
      .useMocker((token) => {
        if (token === Sequelize) {
          const sequelizeCreateResult: SignupDto = {
            email: 'mockEmail@mock',
            password: 'passWord1',
          };
          return { create: jest.fn().mockResolvedValue(sequelizeCreateResult) };
        }
        if (token === JwtService) {
          const jwtSignAsyncResult: Promise<string> =
            Promise.resolve('some token string');
          return { signAsync: jest.fn().mockResolvedValue(jwtSignAsyncResult) };
        }
        if (token === MailService) {
          return { sendEmail: jest.fn() };
        }
      })
      .compile();

    service = module.get<AuthService>(AuthService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
