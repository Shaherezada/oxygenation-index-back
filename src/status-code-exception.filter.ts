import { Catch, HttpException } from '@nestjs/common';
import type { ArgumentsHost, ExceptionFilter } from '@nestjs/common';
import type { Response } from 'express';

// ответ на ошибку - только код состояния HTTP (400, 404, 409),
// без сообщений и без дублирования кода в теле
@Catch()
export class StatusCodeExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const response = host.switchToHttp().getResponse<Response>();

    // у HttpException свой код, любая другая ошибка - это 500
    if (exception instanceof HttpException) {
      response.status(exception.getStatus()).send();
      return;
    }
    console.error(exception);
    response.status(500).send();
  }
}
