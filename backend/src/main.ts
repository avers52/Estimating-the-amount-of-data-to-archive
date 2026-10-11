import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  // Включаем CORS для будущих фронтендов/клиентов
  app.enableCors();

  const port = 3000;
  await app.listen(port);
  console.log(`REST API Server is running on: http://localhost:${port}/api/compression-algorithms`);
}
bootstrap();