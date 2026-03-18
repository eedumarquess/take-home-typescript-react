import { randomUUID } from 'node:crypto';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { compare } from 'bcrypt';
import type { StringValue } from 'ms';
import { AppRole } from '../../common/enums/app-role.enum';
import { AppException } from '../../common/errors/app.exception';
import { AppErrorCode } from '../../common/errors/app-error-code.enum';
import type { TokenPayload } from '../../common/interfaces/token-payload.interface';
import { parseDurationToMilliseconds } from '../../common/utils/duration.util';
import { toAppRole } from '../../common/utils/role.util';
import { UsersService } from '../../users/services/users.service';
import { LoginDto } from '../dto/login.dto';
import { RefreshSessionsRepository } from '../repositories/refresh-sessions.repository';

type AuthenticatedUser = {
  id: string;
  email: string;
  role: AppRole;
};

type AuthTokens = {
  accessToken: string;
  refreshToken: string;
};

type AuthResult = AuthTokens & {
  user: AuthenticatedUser;
};

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly refreshSessionsRepository: RefreshSessionsRepository,
  ) {}

  async login({ email, password }: LoginDto): Promise<AuthResult> {
    const user = await this.usersService.findByEmail(email);

    if (!user) {
      throw new AppException(401, AppErrorCode.INVALID_CREDENTIALS, 'Email ou senha invalidos', []);
    }

    const passwordMatches = await compare(password, user.password);

    if (!passwordMatches) {
      throw new AppException(401, AppErrorCode.INVALID_CREDENTIALS, 'Email ou senha invalidos', []);
    }

    const authenticatedUser = {
      id: user.id,
      email: user.email,
      role: toAppRole(user.role),
    } satisfies AuthenticatedUser;

    const tokens = await this.issueTokensForUser({
      sub: authenticatedUser.id,
      email: authenticatedUser.email,
      role: authenticatedUser.role,
    });

    return {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      user: authenticatedUser,
    };
  }

  async refresh(refreshToken?: string) {
    if (!refreshToken) {
      throw new AppException(
        401,
        AppErrorCode.INVALID_REFRESH_TOKEN,
        'Refresh token invalido ou expirado',
        [],
      );
    }

    const payload = await this.verifyRefreshToken(refreshToken);
    const tokenId = this.extractTokenId(payload);
    const refreshSession = await this.refreshSessionsRepository.findByTokenId(tokenId);

    this.assertRefreshSessionIsActive(refreshSession, payload.sub);

    const user = await this.usersService.findById(payload.sub);

    if (!user) {
      throw new AppException(
        401,
        AppErrorCode.INVALID_REFRESH_TOKEN,
        'Refresh token invalido ou expirado',
        [],
      );
    }

    const tokens = await this.issueTokensForUser({
      sub: user.id,
      email: user.email,
      role: toAppRole(user.role),
    });

    await this.refreshSessionsRepository.revoke({
      tokenId,
      replacedByTokenId: tokens.refreshTokenId,
      revokedAt: new Date(),
    });

    return {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
    };
  }

  async logout(refreshToken?: string) {
    if (!refreshToken) {
      return;
    }

    try {
      const payload = await this.verifyRefreshToken(refreshToken);
      const tokenId = this.extractTokenId(payload);

      await this.refreshSessionsRepository.revoke({
        tokenId,
        revokedAt: new Date(),
      });
    } catch {
      return;
    }
  }

  private async issueTokensForUser(
    payload: Omit<TokenPayload, 'jti' | 'iat' | 'exp'>,
  ): Promise<AuthTokens & { refreshTokenId: string }> {
    const accessTokenExpiresIn = this.configService.getOrThrow<string>(
      'JWT_EXPIRES_IN',
    ) as StringValue;
    const refreshTokenExpiresIn = this.configService.getOrThrow<string>(
      'JWT_REFRESH_EXPIRES_IN',
    ) as StringValue;
    const refreshTokenId = randomUUID();
    const refreshPayload = {
      ...payload,
      jti: refreshTokenId,
    } satisfies TokenPayload;

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, {
        secret: this.configService.getOrThrow<string>('JWT_SECRET'),
        expiresIn: accessTokenExpiresIn,
      }),
      this.jwtService.signAsync(refreshPayload, {
        secret: this.configService.getOrThrow<string>('JWT_REFRESH_SECRET'),
        expiresIn: refreshTokenExpiresIn,
      }),
    ]);

    await this.refreshSessionsRepository.create({
      userId: payload.sub,
      tokenId: refreshTokenId,
      expiresAt: new Date(Date.now() + parseDurationToMilliseconds(refreshTokenExpiresIn)),
    });

    return {
      accessToken,
      refreshToken,
      refreshTokenId,
    };
  }

  private async verifyRefreshToken(refreshToken: string) {
    try {
      return await this.jwtService.verifyAsync<TokenPayload>(refreshToken, {
        secret: this.configService.getOrThrow<string>('JWT_REFRESH_SECRET'),
      });
    } catch {
      throw new AppException(
        401,
        AppErrorCode.INVALID_REFRESH_TOKEN,
        'Refresh token invalido ou expirado',
        [],
      );
    }
  }

  private extractTokenId(payload: TokenPayload) {
    if (!payload.jti) {
      throw new AppException(
        401,
        AppErrorCode.INVALID_REFRESH_TOKEN,
        'Refresh token invalido ou expirado',
        [],
      );
    }

    return payload.jti;
  }

  private assertRefreshSessionIsActive(
    refreshSession: {
      userId: string;
      expiresAt: Date;
      revokedAt: Date | null;
    } | null,
    userId: string,
  ) {
    if (
      !refreshSession ||
      refreshSession.userId !== userId ||
      refreshSession.revokedAt !== null ||
      refreshSession.expiresAt.getTime() <= Date.now()
    ) {
      throw new AppException(
        401,
        AppErrorCode.INVALID_REFRESH_TOKEN,
        'Refresh token invalido ou expirado',
        [],
      );
    }
  }
}
