import request from 'supertest';
import { Test } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { AuthModule } from '../src/modules/auth/auth.module';
import { Sequelize } from 'sequelize-typescript';
import { AppModule } from '../src/app.module';

describe('Signup (e2e)', () => {
  let app: INestApplication;
  let sequelize: Sequelize;

  beforeAll(async () => {
    process.env.NODE_ENV = 'test';
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleRef.createNestApplication();
    await app.init();

    sequelize = moduleRef.get<Sequelize>(Sequelize);
    await sequelize.sync({ force: true });
  });

  afterAll(async () => {
    await app.close();
  });

  it(`/Post api/auth/signup`, async () => {
    const body = { email: 'zolotukhinpv@i.ua', password: 'passWord1' };
    const response = await request(app.getHttpServer())
      .post('/api/auth/signup')
      .send(body)
      .expect(201);

    expect(response.text).toBe(
      `Signup successfully, a message containing a confirmation link has been sent to email: ${body.email}`,
    );
  });

});
