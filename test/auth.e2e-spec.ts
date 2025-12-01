import request from 'supertest';

import { Test } from '@nestjs/testing';
import { INestApplication, VersioningType } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { getModelToken } from '@nestjs/sequelize';

import { Sequelize } from 'sequelize-typescript';
import cookieParser from 'cookie-parser';
import Cookies from 'expect-cookies';

import { AppModule } from '../src/app.module';
import { DBConstraintExceptionFilter } from '../src/filters/DBConstraintException.filter';
import { User } from '../src/modules/auth/models/user.model';

describe('AUTH (e2e)', () => {
  const version: string = '1';
  const signupPath = `/v${version}/api/auth/signup`;
  const confirmEmailPath = `/v${version}/api/auth/confirm`;
  const loginPath = `/v${version}/api/auth/login`;
  const logoutPath = `/v${version}/api/auth/logout`;

  let app: INestApplication;
  let sequelize: Sequelize;
  let jwtService: JwtService;
  let agent: request.Agent;

  beforeAll(async () => {
    process.env.NODE_ENV = 'test';
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleRef.createNestApplication();
    app.enableVersioning({ type: VersioningType.URI });
    app.useGlobalFilters(new DBConstraintExceptionFilter());
    app.use(cookieParser());
    await app.init();

    agent = request.agent(app.getHttpServer());

    jwtService = moduleRef.get<JwtService>(JwtService);

    sequelize = moduleRef.get<Sequelize>(Sequelize);
    await sequelize.sync({ force: true });
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(async () => {
    await sequelize.truncate({ cascade: true });
  });

  describe('SIGNUP & EMAIL CONFIRM', () => {
    it(`should sign up successfully with valid credentials`, async () => {
      const body = { email: 'zolotukhinpv@i.ua', password: 'passWord1%' };
      const response = await request(app.getHttpServer())
        .post(signupPath)
        .send(body)
        .expect(201);

      expect(response.body.message).toBe(
        `Signup successfully, a message containing a confirmation link has been sent to email: ${body.email}`,
      );
    });

    it(`should fail when a duplicate email`, async () => {
      const body = { email: 'zolotukhinpv@i.ua', password: 'passWord1%' };
      let response = await request(app.getHttpServer())
        .post(signupPath)
        .send(body)
        .expect(201);

      expect(response.body.message).toBe(
        `Signup successfully, a message containing a confirmation link has been sent to email: ${body.email}`,
      );

      response = await request(app.getHttpServer())
        .post(signupPath)
        .send(body)
        .expect(409);

      expect(response.body.message).toMatch(/email must be unique/);
    });

    it(`should fail when request body is empty`, async () => {
      const body = undefined;
      const response = await request(app.getHttpServer())
        .post(signupPath)
        .send(body)
        .expect(400);

      expect(response.body.message).toBe(
        `✖ Invalid input: expected object, received undefined`,
      );
    });

    it(`should fail when email format is invalid`, async () => {
      const body = { email: 'wrongemail', password: 'passWord1' };

      const response = await request(app.getHttpServer())
        .post(signupPath)
        .send(body)
        .expect(400);

      expect(response.body.message).toMatch(
        /Please enter a valid email address/,
      );
    });

    it(`should fail when password is too short`, async () => {
      const body = { email: 'zolotukhinpv@i.ua', password: 'pA1%s' };

      const response = await request(app.getHttpServer())
        .post(signupPath)
        .send(body)
        .expect(400);

      expect(response.body.message).toMatch(/Minimum length:/);
    });

    it(`should fail when password does not meet complexity requirements`, async () => {
      const body = { email: 'zolotukhinpv@i.ua', password: 'password' };

      const response = await request(app.getHttpServer())
        .post(signupPath)
        .send(body)
        .expect(400);

      expect(response.body.message).toMatch(/Password must contain/);
    });

    it(`should confirm email successfully`, async () => {
      const body = { email: 'zolotukhinpv@i.ua', password: 'passWord1%' };
      await request(app.getHttpServer())
        .post(signupPath)
        .send(body)
        .expect(201);

      const token: string = await jwtService.signAsync(
        {
          email: body.email,
        },
        { expiresIn: '15m', secret: process.env.JWT_SECRET },
      );

      const response = await request(app.getHttpServer())
        .get(confirmEmailPath)
        .query({ token })
        .send()
        .expect(200);

      expect(response.body.message).toBe(`Email successfully confirmed`);
    });

    it(`should fail when token is missing`, async () => {
      const body = { email: 'zolotukhinpv@i.ua', password: 'passWord1%' };
      await request(app.getHttpServer())
        .post(signupPath)
        .send(body)
        .expect(201);

      const response = await request(app.getHttpServer())
        .get(confirmEmailPath)
        .send(body)
        .expect(401);

      expect(response.body.message).toBe(`Unauthorized`);
    });

    it(`should fail when token is not valid`, async () => {
      const body = { email: 'zolotukhinpv@i.ua', password: 'passWord1%' };
      await request(app.getHttpServer())
        .post(signupPath)
        .send(body)
        .expect(201);

      const token: string = 'wrong_token';

      const response = await request(app.getHttpServer())
        .get(confirmEmailPath)
        .query({ token })
        .send(body)
        .expect(401);

      expect(response.body.message).toBe(`Unauthorized`);
    });

    it(`should fail when token is wrong`, async () => {
      const body = { email: 'zolotukhinpv@i.ua', password: 'passWord1%' };
      const wrongEmail = 'zolotukhinpv2@i.ua';
      await request(app.getHttpServer())
        .post(signupPath)
        .send(body)
        .expect(201);

      const token: string = await jwtService.signAsync(
        {
          email: wrongEmail,
        },
        { expiresIn: '15m', secret: process.env.JWT_SECRET },
      );

      const response = await request(app.getHttpServer())
        .get(confirmEmailPath)
        .query({ token })
        .send(body)
        .expect(400);

      expect(response.body.message).toBe(
        `User with email: ${wrongEmail} not found`,
      );
    });
  });

  describe('LOGIN', () => {
    const validBody = { email: 'zolotukhinpv@i.ua', password: 'passWord1%' };
    beforeEach(async () => {
      await request(app.getHttpServer())
        .post(signupPath)
        .send(validBody)
        .expect(201);

      const token: string = await jwtService.signAsync(
        {
          email: validBody.email,
        },
        { expiresIn: '15m', secret: process.env.JWT_SECRET },
      );

      await request(app.getHttpServer())
        .get(confirmEmailPath)
        .query({ token })
        .send()
        .expect(200);
    });

    it(`should login successfully`, async () => {
      const response = await request(app.getHttpServer())
        .post(loginPath)
        .send(validBody)
        .expect(200)
        .expect((res) => {
          const cookies = res.headers['set-cookie'];
          if (!cookies) throw new Error('No cookies returned');

          const hasAccessToken = Array.from(cookies).some((cookie) =>
            cookie.startsWith('accessToken='),
          );
          if (!hasAccessToken) throw new Error('session cookie missing');
          const hasRefreshToken = Array.from(cookies).some((cookie) =>
            cookie.startsWith('refreshToken='),
          );
          if (!hasRefreshToken) throw new Error('session cookie missing');
        });

      expect(response.body.message).toBe(`Login successfully`);
    });

    it(`should fail when request body is empty`, async () => {
      const body = undefined;
      const response = await request(app.getHttpServer())
        .post(loginPath)
        .send(body)
        .expect(400);

      expect(response.body.message).toBe(
        `✖ Invalid input: expected object, received undefined`,
      );
    });

    it(`should fail when email format is invalid`, async () => {
      const body = { email: 'wrongemail', password: 'passWord1' };

      const response = await request(app.getHttpServer())
        .post(loginPath)
        .send(body)
        .expect(400);

      expect(response.body.message).toMatch(
        /Please enter a valid email address/,
      );
    });

    it(`should fail when password is too short`, async () => {
      const body = { email: 'zolotukhinpv@i.ua', password: 'pA1%s' };

      const response = await request(app.getHttpServer())
        .post(loginPath)
        .send(body)
        .expect(400);

      expect(response.body.message).toMatch(/Minimum length:/);
    });

    it(`should fail when password does not meet complexity requirements`, async () => {
      const body = { email: 'zolotukhinpv@i.ua', password: 'password' };

      const response = await request(app.getHttpServer())
        .post(loginPath)
        .send(body)
        .expect(400);

      expect(response.body.message).toMatch(/Password must contain/);
    });

    it(`should fail when email not confirmed`, async () => {
      const validBody = { email: 'zolotukhinpv2@i.ua', password: 'passWord1%' };

      await request(app.getHttpServer())
        .post(signupPath)
        .send(validBody)
        .expect(201);

      const response = await request(app.getHttpServer())
        .post(loginPath)
        .send(validBody)
        .expect(403);

      expect(response.body.message).toBe(
        `Email not confirmed, a message containing a confirmation link has been sent to email: ${validBody.email}`,
      );
    });

    it(`should fail when user not found`, async () => {
      const validBody = { email: 'zolotukhinpv2@i.ua', password: 'passWord1%' };

      const response = await request(app.getHttpServer())
        .post(loginPath)
        .send(validBody)
        .expect(404);

      expect(response.body.message).toBe(`Email or password invalid`);
    });

    it(`should fail when password wrong`, async () => {
      const notValidBody = {
        email: 'zolotukhinpv@i.ua',
        password: 'passWord2%',
      };

      const response = await request(app.getHttpServer())
        .post(loginPath)
        .send(notValidBody)
        .expect(404);

      expect(response.body.message).toBe(`Email or password invalid`);
    });
  });

  describe.only('LOGOUT', () => {
    const validBody = { email: 'zolotukhinpv@i.ua', password: 'passWord1%' };

    beforeEach(async () => {
      await agent.post(signupPath).send(validBody).expect(201);

      const token: string = await jwtService.signAsync(
        { email: validBody.email },
        { expiresIn: '15m', secret: process.env.JWT_SECRET },
      );

      await agent.get(confirmEmailPath).query({ token }).expect(200);

      const loginResponse = await agent
        .post(loginPath)
        .send(validBody)
        .expect(200);

      if (
        !loginResponse.headers['set-cookie'] ||
        loginResponse.headers['set-cookie'].length === 0
      ) {
        throw new Error(
          'Login did not set any cookies. Check your auth setup.',
        );
      }
    });

    it(`should logout successfully and clear auth cookies`, async () => {
      const logoutResponse = await agent
        .get(logoutPath)
        .expect(200)
        .expect(Cookies.not('set', { name: 'accessToken' }))
        .expect(Cookies.not('set', { name: 'refreshToken' }));
      expect(logoutResponse.body.message).toBe(`Logout successfully`);
    });

    it(`should fail when user not found`, async () => {
      const userModel = app.get<typeof User>(getModelToken(User));
      await userModel.destroy({ where: { email: validBody.email } });
      const logoutResponse = await agent.get(logoutPath).expect(404);
      expect(logoutResponse.body.message).toBe(
        `User with email: ${validBody.email} not found`,
      );
    });

    it(`should fail when accessToken not exists in cookie`, async () => {
      const logoutResponse = await request(app.getHttpServer())
        .get(logoutPath)
        .expect(401);
      expect(logoutResponse.body.message).toBe(`Unauthorized`);
    });

    it(`should fail when accessToken not valid`, async () => {
      const logoutResponse = await request(app.getHttpServer())
        .get(logoutPath)
        .set('Cookie', 'accessToken=ffffffffffffffff')
        .expect(401);
      expect(logoutResponse.body.message).toBe(`Unauthorized`);
    });
  });
});
