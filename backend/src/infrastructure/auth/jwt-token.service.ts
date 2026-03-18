import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import type { StringValue } from 'ms';
import type {
  ITokenService,
  RefreshTokenPayload,
  TokenPayloadData,
} from '../../domain/auth/token-service';

@Injectable()
export class JwtTokenService implements ITokenService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  signAccessToken(payload: TokenPayloadData) {
    return this.jwtService.signAsync(payload, {
      expiresIn: this.configService.getOrThrow<string>('JWT_EXPIRES_IN') as StringValue,
      secret: this.configService.getOrThrow<string>('JWT_SECRET'),
    });
  }

  signRefreshToken(payload: RefreshTokenPayload) {
    return this.jwtService.signAsync(payload, {
      expiresIn: this.configService.getOrThrow<string>('JWT_REFRESH_EXPIRES_IN') as StringValue,
      secret: this.configService.getOrThrow<string>('JWT_REFRESH_SECRET'),
    });
  }

  verifyRefreshToken(refreshToken: string) {
    return this.jwtService.verifyAsync<RefreshTokenPayload>(refreshToken, {
      secret: this.configService.getOrThrow<string>('JWT_REFRESH_SECRET'),
    });
  }
}
