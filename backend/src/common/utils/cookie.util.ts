import type { ConfigService } from '@nestjs/config';
import type { CookieOptions } from 'express';
import { parseDurationToMilliseconds } from './duration.util';

export function getRefreshTokenCookieOptions(configService: ConfigService): CookieOptions {
  return {
    httpOnly: true,
    sameSite: 'strict',
    secure: configService.getOrThrow<boolean>('COOKIE_SECURE'),
    path: '/api/auth/refresh',
    maxAge: parseDurationToMilliseconds(configService.getOrThrow<string>('JWT_REFRESH_EXPIRES_IN')),
  };
}
