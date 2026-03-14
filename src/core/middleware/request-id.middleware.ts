import { Injectable, NestMiddleware } from '@nestjs/common';
import { v4 as uuid } from 'uuid';
import { Request, Response, NextFunction } from 'express';

@Injectable()
export class RequestIdMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    const requestId = uuid();

    req['requestId'] = requestId;
    res.setHeader('X-Request-Id', requestId);

    next();
  }
}
