import { Injectable, NestMiddleware } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import type { Request, Response, NextFunction } from 'express';

// Extend Express Request type to include requestId
declare module 'express-serve-static-core' {
  interface Request {
    requestId: string;
  }
}

@Injectable()
export class RequestIdMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    // Generate UUID safely
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call
    const requestId = uuidv4() as string;

    // Attach requestId to request object
    req.requestId = requestId;

    // Add it as a response header
    res.setHeader('X-Request-Id', requestId);

    next();
  }
}
