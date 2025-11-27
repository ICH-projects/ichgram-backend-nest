jest.mock('bcrypt', () => ({
  hash: jest.fn().mockResolvedValue('hashed-password'),
}));

import { Test, TestingModule } from '@nestjs/testing';
import { Sequelize } from 'sequelize-typescript';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';

import { AuthService } from './auth.service';
import { MailService } from '../mail/mail.service';
import { User } from './models/user.model';
import { getModelToken } from '@nestjs/sequelize';

describe('AuthService', () => {
  let authService: AuthService;

  let sequelize: jest.Mocked<Sequelize>;
  let jwtService: jest.Mocked<JwtService>;
  let mailService: jest.Mocked<MailService>;
  let userRepository: { create: jest.Mock<any, any> };

  beforeEach(async () => {
    const moduleRef: TestingModule = await Test.createTestingModule({
      providers: [AuthService],
    })
      .useMocker((token) => {
        if (token === Sequelize) {
          return {
            transaction: jest.fn().mockImplementation(async (callback) => {
              const t = {};
              return callback(t);
            }),
          };
        }
        if (token === JwtService) {
          return {
            signAsync: jest.fn().mockResolvedValue('mocked-jwt-token'),
          };
        }
        if (token === MailService) {
          return {
            sendEmail: jest.fn().mockResolvedValue(undefined),
          };
        }
        if (token === getModelToken(User)) {
          return {
            create: jest.fn().mockResolvedValue({ id: 1 }),
          };
        }
        return {};
      })
      .compile();

    authService = moduleRef.get<AuthService>(AuthService);
    sequelize = moduleRef.get(Sequelize);
    jwtService = moduleRef.get(JwtService);
    mailService = moduleRef.get(MailService);
    userRepository = moduleRef.get(getModelToken(User)) as unknown as {
      create: jest.Mock<any, any>;
    };
  });

  it('should be defined', () => {
    expect(authService).toBeDefined();
  });

  it('should sign up a user, hash password, save user, send email, and return message', async () => {
    const signupDto = {
      email: 'john@example.com',
      password: 'password123',
    };

    const result = await authService.signup(signupDto);

    // bcrypt hashing
    expect(bcrypt.hash).toHaveBeenCalledWith('password123', 10);

    // transaction wrapper
    expect(sequelize.transaction).toHaveBeenCalled();

    // user creation
    expect(userRepository.create).toHaveBeenCalledWith(
      {
        email: signupDto.email,
        password: 'hashed-password',
      },
      { transaction: {} },
    );

    // jwt creation
    expect(jwtService.signAsync).toHaveBeenCalledWith(
      { email: signupDto.email },
      expect.any(Object),
    );

    // email sending
    expect(mailService.sendEmail).toHaveBeenCalled();

    // returned message
    expect(result).toBe(
      `Signup successfully, a message containing a confirmation link has been sent to email: ${signupDto.email}`,
    );
  });
});
