import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  app.enableCors();
  const port = 3000;
  await app.listen(port);
  console.log(`Server running at http://localhost:${port}/api`);
}
bootstrap();
