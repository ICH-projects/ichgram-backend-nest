import request from 'supertest';
import { Test } from '@nestjs/testing';
import { INestApplication, VersioningType } from '@nestjs/common';
import { Sequelize } from 'sequelize-typescript';
import { AppModule } from '../src/app.module';
import { DBConstraintExceptionFilter } from '../src/filters/DBConstraintException.filter';
import { JwtService } from '@nestjs/jwt';

describe('Signup (e2e)', () => {
  const version: string = '1';
  const signupPath = `/v${version}/api/auth/signup`;
  const confirmEmailPath = `/v${version}/api/auth/confirm`;

  let app: INestApplication;
  let sequelize: Sequelize;
  let jwtService: JwtService;

  beforeAll(async () => {
    process.env.NODE_ENV = 'test';
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleRef.createNestApplication();
    app.enableVersioning({ type: VersioningType.URI });
    app.useGlobalFilters(new DBConstraintExceptionFilter());
    await app.init();

    jwtService = moduleRef.get<JwtService>(JwtService);

    sequelize = moduleRef.get<Sequelize>(Sequelize);
    await sequelize.sync({ force: true });
  });

  beforeEach(async () => {
    await sequelize.truncate({ cascade: true });
  });

  afterAll(async () => {
    await app.close();
  });

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

    expect(response.body.message).toMatch(/Please enter a valid email address/);
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
    await request(app.getHttpServer()).post(signupPath).send(body).expect(201);

    const token: string = await jwtService.signAsync(
      {
        email: body.email,
      },
      { expiresIn: '15m', secret: process.env.JWT_SECRET },
    );

    const response = await request(app.getHttpServer())
      .get(confirmEmailPath)
      .query({ token })
      .send(body)
      .expect(200);

    expect(response.body.message).toBe(`Email successfully confirmed`);
  });

  it(`should fail when token is missing`, async () => {
    const body = { email: 'zolotukhinpv@i.ua', password: 'passWord1%' };
    await request(app.getHttpServer()).post(signupPath).send(body).expect(201);

    const response = await request(app.getHttpServer())
      .get(confirmEmailPath)
      .send(body)
      .expect(401);

    expect(response.body.message).toBe(`Unauthorized`);
  });

  it(`should fail when token is not valid`, async () => {
    const body = { email: 'zolotukhinpv@i.ua', password: 'passWord1%' };
    await request(app.getHttpServer()).post(signupPath).send(body).expect(201);

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
    const wrongEmail = 'zolotukhinpv2@i.ua'
    await request(app.getHttpServer()).post(signupPath).send(body).expect(201);

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

    expect(response.body.message).toBe(`User with email: ${wrongEmail} not found`);
  });
});
