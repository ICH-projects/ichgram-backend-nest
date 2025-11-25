import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { HttpValidationExceptionFilter } from './filters/HttpValidationException.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.useGlobalFilters(new HttpValidationExceptionFilter());
  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
