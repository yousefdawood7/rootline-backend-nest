import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { randomUUID } from 'node:crypto';

@Injectable()
export class RequestIdMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction): void {
    const headerId = req.headers['x-request-id'];
    const requestId =
      typeof headerId === 'string' && headerId.trim().length > 0
        ? headerId
        : randomUUID();

    req.id = requestId;
    res.setHeader('X-Request-Id', requestId);

    next();
  }
}
