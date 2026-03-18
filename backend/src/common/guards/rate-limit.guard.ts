import { type CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Request } from 'express';
import { AppException } from '../errors/app.exception';
import { AppErrorCode } from '../errors/app-error-code.enum';

@Injectable()
export class RateLimitGuard implements CanActivate {
  private readonly requestsByIp = new Map<string, number[]>();

  constructor(private readonly configService: ConfigService) {}

  canActivate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest<Request>();
    const forwardedFor = request.headers['x-forwarded-for'];
    const forwardedIp = Array.isArray(forwardedFor)
      ? forwardedFor[0]
      : forwardedFor?.split(',')[0]?.trim();
    const ipAddress = forwardedIp || request.ip || request.socket.remoteAddress || 'unknown';
    const ttlInMs = this.configService.getOrThrow<number>('THROTTLE_TTL_SECONDS') * 1000;
    const limit = this.configService.getOrThrow<number>('THROTTLE_LIMIT');
    const now = Date.now();
    const threshold = now - ttlInMs;
    const currentEntries = (this.requestsByIp.get(ipAddress) ?? []).filter(
      (timestamp) => timestamp > threshold,
    );

    if (currentEntries.length >= limit) {
      this.requestsByIp.set(ipAddress, currentEntries);

      throw new AppException(
        429,
        AppErrorCode.RATE_LIMIT_EXCEEDED,
        'Limite de requisicoes atingido',
        [],
      );
    }

    currentEntries.push(now);
    this.requestsByIp.set(ipAddress, currentEntries);

    return true;
  }
}
