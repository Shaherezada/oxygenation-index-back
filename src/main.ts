import { NestFactory } from '@nestjs/core';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import hbs from 'hbs';
import { AppModule } from './app.module.js';

const currentDir = dirname(fileURLToPath(import.meta.url));
const projectRootDir = join(currentDir, '..');

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  app.setBaseViewsDir(join(projectRootDir, 'views'));
  app.setViewEngine('hbs');
  hbs.registerPartials(join(projectRootDir, 'views', 'partials'));

  hbs.registerHelper('eq', (left: unknown, right: unknown) => left === right);

  app.useStaticAssets(join(projectRootDir, 'public'));

  await app.listen(process.env.PORT ?? 3000);
}
await bootstrap();
