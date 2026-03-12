import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Use PORT from env, or 3001 for local dev, otherwise 3000
  const port =
    process.env.NODE_ENV === 'development' ? 3001 : (process.env.PORT ?? 3000);

  await app.listen(port);
  console.log(`🚀 Application listening on port ${port}`);
}
bootstrap();
