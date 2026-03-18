import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { configureApp } from './bootstrap/configure-app';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = configureApp(app);
  const port = configService.getOrThrow<number>('PORT');

  await app.listen(port);
}

void bootstrap();
