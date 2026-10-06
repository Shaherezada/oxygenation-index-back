import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module.js';
import { StatusCodeExceptionFilter } from './status-code-exception.filter.js';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // адрес каждого метода веб-сервиса начинается с /api
  app.setGlobalPrefix('api');

  // проверка входных данных по DTO: поля, которых в DTO нет (id, status,
  // creatorId, даты) не принимаются, значения приводятся к типам полей
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // при ошибке клиеет получает только код состояния
  app.useGlobalFilters(new StatusCodeExceptionFilter());

  await app.listen(process.env.PORT ?? 3000);
}
await bootstrap();
