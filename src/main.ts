import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { AllExceptionsFilter } from './core/filters/global-exception.filter'; // <- root folder

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Apply global exception filter
  app.useGlobalFilters(new AllExceptionsFilter());

  await app.listen(process.env.PORT ?? 3000);
  console.log(`🚀 App running on port ${process.env.PORT ?? 3000}`);
}
bootstrap();
