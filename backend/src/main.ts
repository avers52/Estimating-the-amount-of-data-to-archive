import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { AppModule } from './app.module';
import session from 'express-session';
import cookieParser from 'cookie-parser';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  // 1. Включаем CORS с поддержкой передачи кук
  app.enableCors({
    origin: true,
    credentials: true,
  });

  // 2. Куки и сессии
  app.use(cookieParser());
  app.use(
    session({
      name: 'connect.sid',
      secret: 'compression-secret-session-key', // секретный ключ подписи сессии
      resave: false,
      saveUninitialized: false,
      cookie: {
        httpOnly: true,
        secure: false, // true при наличии HTTPS
        maxAge: 24 * 60 * 60 * 1000, // 1 день
      },
    }),
  );

  // 3. Настройка Swagger
  const config = new DocumentBuilder()
    .setTitle('Compression Algorithms API')
    .setDescription(
      'REST API сервиса каталогизации алгоритмов сжатия данных. Без авторизации доступно чтение каталога и ленты, с авторизацией — управление черновиками и лайками.',
    )
    .setVersion('1.0')
    .addCookieAuth('connect.sid', {
      type: 'apiKey',
      in: 'cookie',
      name: 'connect.sid',
      description: 'Сессионная кука авторизации (устанавливается автоматически после /api/login)',
    })
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('swagger', app, document);

  const port = 3000;
  await app.listen(port);
  console.log(`Server: http://localhost:${port}`);
  console.log(`Swagger UI: http://localhost:${port}/swagger`);
}
bootstrap();