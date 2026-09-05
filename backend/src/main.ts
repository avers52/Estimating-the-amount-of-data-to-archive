import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { AppModule } from './app.module';
import { join } from 'path';
import * as express from 'express';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  // Включаем парсинг данных обычных HTML-форм
  app.use(express.urlencoded({ extended: true }));
  app.use(express.json());

  // Настройка статики и шаблонизатора Handlebars
  app.useStaticAssets(join(__dirname, '..', 'public'));
  app.setBaseViewsDir(join(__dirname, '..', 'views'));
  app.setViewEngine('hbs');

  const port = 3000;
  await app.listen(port);
  console.log(`Application is running on: http://localhost:${port}/compression-algorithms/catalog`);
}
bootstrap();