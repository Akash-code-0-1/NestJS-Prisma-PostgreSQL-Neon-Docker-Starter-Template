import '@pm2/io';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { AllExceptionsFilter } from './core/filters/global-exception.filter';

import { WinstonLogger } from './core/logger/winston.logger';

import { LoggingInterceptor } from './core/interceptors/logging.interceptor';
import { PerformanceInterceptor } from './core/matrics/performance.interceptor';
import { ResponseInterceptor } from './core/interceptors/response.interceptor';
import { DebugInterceptor } from './core/interceptors/debug.interceptor';
import { MonitoringInterceptor } from './core/interceptors/monitoring.interceptor';
async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: WinstonLogger,
  });

  app.useGlobalFilters(new AllExceptionsFilter());

  app.useGlobalInterceptors(
    new LoggingInterceptor(),
    new PerformanceInterceptor(),
    new ResponseInterceptor(),
    new DebugInterceptor(),
    new MonitoringInterceptor(),
  );

  await app.listen(process.env.PORT ?? 3000);

  console.log(`🚀 App running on port ${process.env.PORT ?? 3000}`);
}

bootstrap();
