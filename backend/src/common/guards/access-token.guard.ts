import { type CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { IS_PUBLIC_ROUTE_KEY } from '../decorators/public.decorator';
import { AppException } from '../errors/app.exception';
import { AppErrorCode } from '../errors/app-error-code.enum';
import type { AuthenticatedRequest } from '../interfaces/authenticated-request.interface';
import type { TokenPayload } from '../interfaces/token-payload.interface';

@Injectable()
export class AccessTokenGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async canActivate(context: ExecutionContext) {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_ROUTE_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const authorizationHeader = request.headers.authorization;

    if (!authorizationHeader?.startsWith('Bearer ')) {
      throw new AppException(401, AppErrorCode.INVALID_TOKEN, 'Token mal formado ou invalido', []);
    }

    const accessToken = authorizationHeader.slice('Bearer '.length).trim();

    if (accessToken.length === 0) {
      throw new AppException(401, AppErrorCode.INVALID_TOKEN, 'Token mal formado ou invalido', []);
    }

    try {
      const payload = await this.jwtService.verifyAsync<TokenPayload>(accessToken, {
        secret: this.configService.getOrThrow<string>('JWT_SECRET'),
      });

      request.user = {
        sub: payload.sub,
        email: payload.email,
        role: payload.role,
      };

      return true;
    } catch (error) {
      if (error instanceof Error && error.name === 'TokenExpiredError') {
        throw new AppException(401, AppErrorCode.TOKEN_EXPIRED, 'Access token expirado', []);
      }

      throw new AppException(401, AppErrorCode.INVALID_TOKEN, 'Token mal formado ou invalido', []);
    }
  }
}
