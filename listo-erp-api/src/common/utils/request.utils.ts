import { Request } from 'express';

export function getClientIp(req: Request): string | undefined {
  const forwarded = req.headers['x-forwarded-for'];
  if (forwarded) {
    return (typeof forwarded === 'string' ? forwarded : forwarded[0])
      .split(',')[0]
      .trim();
  }
  return req.ip || req.socket.remoteAddress || undefined;
}

export function getUserAgent(req: Request): string | undefined {
  return req.headers['user-agent'];
}
