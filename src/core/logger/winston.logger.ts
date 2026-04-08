import { WinstonModule } from 'nest-winston';
import * as winston from 'winston';
import type { LoggerService } from '@nestjs/common';

export const WinstonLogger: LoggerService = WinstonModule.createLogger({
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json(),
      ),
    }),
  ],
});
