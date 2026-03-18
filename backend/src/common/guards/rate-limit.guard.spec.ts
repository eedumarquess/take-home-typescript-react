import type { ExecutionContext } from '@nestjs/common';
import { AppException } from '../errors/app.exception';
import { RateLimitGuard } from './rate-limit.guard';

describe('RateLimitGuard', () => {
  const configService = {
    getOrThrow: jest.fn((key: string) => {
      const values: Record<string, number> = {
        THROTTLE_TTL_SECONDS: 60,
        THROTTLE_LIMIT: 2,
      };

      return values[key];
    }),
  };

  it('blocks requests that exceed the configured per-IP threshold', () => {
    const guard = new RateLimitGuard(configService as never);
    const context = {
      switchToHttp: () => ({
        getRequest: () => ({
          headers: {
            'x-forwarded-for': '203.0.113.10',
          },
          ip: '203.0.113.10',
          socket: {
            remoteAddress: '203.0.113.10',
          },
        }),
      }),
    } as ExecutionContext;

    expect(guard.canActivate(context)).toBe(true);
    expect(guard.canActivate(context)).toBe(true);
    expect(() => guard.canActivate(context)).toThrow(AppException);
  });
});
