/* eslint-disable @typescript-eslint/no-unsafe-assignment */
// import { NestFactory } from '@nestjs/core';
// import { AppModule } from './app.module';
// import { AllExceptionsFilter } from './core/filters/global-exception.filter'; // <- root folder

// async function bootstrap() {
//   const app = await NestFactory.create(AppModule);

//   // Apply global exception filter
//   app.useGlobalFilters(new AllExceptionsFilter());

//   await app.listen(process.env.PORT ?? 3000);
//   console.log(`🚀 App running on port ${process.env.PORT ?? 3000}`);
// }
// bootstrap();
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { AllExceptionsFilter } from './core/filters/global-exception.filter';

import { WinstonLogger } from './core/logger/winston.logger';

import { LoggingInterceptor } from './core/interceptors/logging.interceptor';
import { PerformanceInterceptor } from './core/matrics/performance.interceptor';
import { ResponseInterceptor } from './core/interceptors/response.interceptor';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: WinstonLogger,
  });

  app.useGlobalFilters(new AllExceptionsFilter());

  app.useGlobalInterceptors(
    new LoggingInterceptor(),
    new PerformanceInterceptor(),
    new ResponseInterceptor(),
  );

  await app.listen(process.env.PORT ?? 3000);

  console.log(`🚀 App running on port ${process.env.PORT ?? 3000}`);
}

bootstrap();
