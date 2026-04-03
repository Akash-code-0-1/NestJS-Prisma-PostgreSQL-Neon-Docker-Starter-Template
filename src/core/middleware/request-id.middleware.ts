/* eslint-disable @typescript-eslint/no-unnecessary-type-assertion */
import { Injectable, NestMiddleware } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import type { Request, Response, NextFunction } from 'express';

declare module 'express-serve-static-core' {
  interface Request {
    requestId: string;
  }
}

@Injectable()
export class RequestIdMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    const requestId = uuidv4() as string;

    req.requestId = requestId;

    res.setHeader('X-Request-Id', requestId);

    next();
  }
}
