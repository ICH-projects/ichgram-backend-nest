import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { VersioningType } from '@nestjs/common';
import cookieParser from 'cookie-parser';

import { AppModule } from './app.module';

import { HttpValidationExceptionFilter } from './filters/HttpValidationException.filter';
import { DBConstraintExceptionFilter } from './filters/DBConstraintException.filter';

import { version } from '../package.json';
import { access } from 'fs';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  // app.enableCors({
  //   origin: true, // allow all origins in test environment
  //   credentials: true,
  // });
  app.use(cookieParser());
  app.enableVersioning({
    type: VersioningType.URI,
    defaultVersion: '1',
  });
  app.useGlobalFilters(
    new HttpValidationExceptionFilter(),
    new DBConstraintExceptionFilter(),
  );

  const config = new DocumentBuilder()
    .setTitle('ichgram API')
    .setDescription('API documentation')
    .setVersion(version)
    .addCookieAuth('accessToken', { type: 'apiKey', in: 'cookie' })
    .addCookieAuth('refreshToken', { type: 'apiKey', in: 'cookie' })
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document, {
    swaggerOptions: {
      withCredentials: true,
    },
  });

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
