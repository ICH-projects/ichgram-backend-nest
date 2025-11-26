import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { HttpValidationExceptionFilter } from './filters/HttpValidationException.filter';
import { DBConstraintExceptionFilter } from './filters/DBConstraintException.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.useGlobalFilters(new HttpValidationExceptionFilter(), new DBConstraintExceptionFilter());
  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
