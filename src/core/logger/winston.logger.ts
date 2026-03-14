/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { WinstonModule } from 'nest-winston';
import * as winston from 'winston';
import type { LoggerService } from '@nestjs/common';

export const WinstonLogger: LoggerService = WinstonModule.createLogger({
  transports: [
    new winston.transports.Console({
      // Use winston.format safely
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json(),
      ),
    }),
  ],
});
