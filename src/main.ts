import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { HttpValidationExceptionFilter } from './filters/HttpValidationException.filter';
import { DBConstraintExceptionFilter } from './filters/DBConstraintException.filter';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { VersioningType } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
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
    .setVersion('1.0')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
