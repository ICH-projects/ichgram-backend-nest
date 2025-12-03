import request from 'supertest';

import { Test } from '@nestjs/testing';
import { INestApplication, VersioningType } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { getModelToken } from '@nestjs/sequelize';

import { Sequelize } from 'sequelize-typescript';
import cookieParser from 'cookie-parser';
import Cookies from 'expect-cookies';
import * as cookie from 'cookie';
import * as bcrypt from 'bcrypt';

import { AppModule } from '../src/app.module';
import { DBConstraintExceptionFilter } from '../src/filters/DBConstraintException.filter';
import { User } from '../src/modules/auth/models/user.model';

describe('AUTH (e2e)', () => {
  const version: string = '1';
  const signupPath = `/v${version}/api/auth/signup`;
  const confirmEmailPath = `/v${version}/api/auth/confirm`;
  const loginPath = `/v${version}/api/auth/login`;
  const logoutPath = `/v${version}/api/auth/logout`;
  const refreshPath = `/v${version}/api/auth/refresh`;

  let app: INestApplication;
  let sequelize: Sequelize;
  let userModel: typeof User;

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

    userModel = app.get<typeof User>(getModelToken(User));

    userModel = app.get<typeof User>(getModelToken(User));

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
      await userModel.create(body);
      await userModel.create(body);

      const response = await request(app.getHttpServer())
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
      await userModel.create(body);
      await userModel.create(body);

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
      await userModel.create(body);
      await userModel.create(body);

      const response = await request(app.getHttpServer())
        .get(confirmEmailPath)
        .send(body)
        .expect(401);

      expect(response.body.message).toBe(`Unauthorized`);
    });

    it(`should fail when token is not valid`, async () => {
      const body = { email: 'zolotukhinpv@i.ua', password: 'passWord1%' };
      const token: string = 'wrong_token';

      await userModel.create(body);

      await userModel.create(body);

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
      await userModel.create(body);
      await userModel.create(body);

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
      const passwordHash: string = await bcrypt.hash(validBody.password, 10);

      await userModel.create({
        ...validBody,
        password: passwordHash,
        isConfirmed: true,
      });
    });

    it(`should login successfully`, async () => {
      const response = await request(app.getHttpServer())
        .post(loginPath)
        .send(validBody)
        .expect(200);
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
      await userModel.update(
        {
          isConfirmed: false,
        },
        { where: { email: validBody.email } },
      );

      const response = await request(app.getHttpServer())
        .post(loginPath)
        .send(validBody)
        .expect(403);

      expect(response.body.message).toBe(
        `Email not confirmed, a message containing a confirmation link has been sent to email: ${validBody.email}`,
      );
    });

    it(`should fail when user not found`, async () => {
      const body = { email: 'zolotukhinpv2@i.ua', password: 'passWord1%' };

      const response = await request(app.getHttpServer())
        .post(loginPath)
        .send(body)
        .send(body)
        .expect(404);

      expect(response.body.message).toBe(`Email or password invalid`);
    });

    it(`should fail when password wrong`, async () => {
      const response = await request(app.getHttpServer())
        .post(loginPath)
        .send({ ...validBody, password: 'passWord2%' })
        .send({ ...validBody, password: 'passWord2%' })
        .expect(404);

      expect(response.body.message).toBe(`Email or password invalid`);
    });
  });

  describe('LOGOUT', () => {
    const validBody = { email: 'zolotukhinpv@i.ua', password: 'passWord1%' };

    beforeEach(async () => {
      const passwordHash: string = await bcrypt.hash(validBody.password, 10);
      await userModel.create({
        ...validBody,
        password: passwordHash,
        isConfirmed: true,
      });

      await agent.post(loginPath).send(validBody).expect(200);
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

  describe('REFRESH', () => {
    const validBody = { email: 'zolotukhinpv@i.ua', password: 'passWord1%' };
    let reqCookie: cookie.SetCookie[];
    let reqRefreshTokenCookie: cookie.SetCookie;
    let reqAccessTokenCookie: cookie.SetCookie;

    beforeEach(async () => {
      const passwordHash: string = await bcrypt.hash(validBody.password, 10);

      await userModel.create({
        ...validBody,
        password: passwordHash,
        isConfirmed: true,
      });

      const loginResponse = await agent
        .post(loginPath)
        .send(validBody)
        .expect(200);

      reqCookie = Array.from(loginResponse.get('Set-Cookie') || []).map((c) =>
        cookie.parseSetCookie(c),
      ) as cookie.SetCookie[];
      reqRefreshTokenCookie = reqCookie.find(
        (c) => c.name === 'refreshToken',
      ) as cookie.SetCookie;
      reqAccessTokenCookie = reqCookie.find(
        (c) => c.name === 'accessToken',
      ) as cookie.SetCookie;
    });

    it(`should refresh tokens successfully`, async () => {
      await new Promise((res) => setTimeout(res, 500));
      const refreshResponse = await agent.get(refreshPath).expect(200);

      const resCookie = Array.from(refreshResponse.get('Set-Cookie') || []).map(
        (c) => cookie.parseSetCookie(c),
      ) as cookie.SetCookie[];
      const resRefreshTokenCookie = resCookie.find(
        (c) => c.name === 'refreshToken',
      ) as cookie.SetCookie;
      const resAccessTokenCookie = resCookie.find(
        (c) => c.name === 'accessToken',
      ) as cookie.SetCookie;

      expect(resRefreshTokenCookie.expires).not.toBe(
        reqRefreshTokenCookie.expires,
      );
      expect(resAccessTokenCookie.expires).not.toBe(
        reqAccessTokenCookie.expires,
      );
      expect(resRefreshTokenCookie.expires).not.toBe(
        reqRefreshTokenCookie.expires,
      );
      expect(resAccessTokenCookie.expires).not.toBe(
        reqAccessTokenCookie.expires,
      );
      expect(refreshResponse.body.message).toBe(`Tokens successfully updated`);
    });

    it(`should fail when user not found`, async () => {
      await userModel.destroy({ where: { email: validBody.email } });
      const refreshResponse = await agent.get(refreshPath).expect(404);
      expect(refreshResponse.body.message).toBe(
        `User with email: ${validBody.email} not found`,
      );
    });

    it(`should fail when refreshToken not exists in cookie`, async () => {
      const refreshResponse = await request(app.getHttpServer())
        .get(refreshPath)
        .expect(401);
      expect(refreshResponse.body.message).toBe(`Unauthorized`);
    });

    it(`should fail when accessToken not valid`, async () => {
      const refreshResponse = await request(app.getHttpServer())
        .get(refreshPath)
        .set('Cookie', 'accessToken=ffffffffffffffff')
        .expect(401);
      expect(refreshResponse.body.message).toBe(`Unauthorized`);
    });
  });
});
