import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create(AppModule);

  app.enableCors({
    origin: ['http://localhost:5173', 'http://localhost:3000', 'file://'],
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
  });

  const port = process.env.PORT ? Number.parseInt(process.env.PORT, 10) : 3100;
  await app.listen(port);
  logger.log(`Vehicle backend running on http://localhost:${port}`);
}

bootstrap();
