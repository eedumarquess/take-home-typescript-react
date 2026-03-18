import { randomUUID } from 'node:crypto';
import type { StringValue } from 'ms';
import { AppRole } from '../../common/enums/app-role.enum';
import { AppException } from '../../common/errors/app.exception';
import { AppErrorCode } from '../../common/errors/app-error-code.enum';
import { parseDurationToMilliseconds } from '../../common/utils/duration.util';
import type { IPasswordHasher } from '../../domain/auth/password-hasher';
import type { IRefreshSessionRepository } from '../../domain/auth/refresh-session.repository';
import type { ITokenService } from '../../domain/auth/token-service';
import { Email } from '../../domain/shared/email';
import type { IUserRepository } from '../../domain/users/user.repository';

type AuthenticatedUser = {
  id: string;
  email: string;
  role: AppRole;
};

export class LoginUseCase {
  constructor(
    private readonly usersRepository: IUserRepository,
    private readonly passwordHasher: IPasswordHasher,
    private readonly tokenService: ITokenService,
    private readonly refreshSessionRepository: IRefreshSessionRepository,
  ) {}

  async execute(input: { email: string; password: string }) {
    const email = new Email(input.email);
    const user = await this.usersRepository.findByEmail(email);

    if (!user) {
      throw invalidCredentials();
    }

    const passwordMatches = await this.passwordHasher.compare(input.password, user.passwordHash);

    if (!passwordMatches) {
      throw invalidCredentials();
    }

    const authenticatedUser: AuthenticatedUser = {
      id: user.id,
      email: user.email.value,
      role: user.role,
    };

    await this.refreshSessionRepository.cleanupExpiredAndRevoked({ userId: user.id });
    const tokens = await prepareTokens(authenticatedUser, this.tokenService);
    await this.refreshSessionRepository.create({
      expiresAt: tokens.refreshTokenExpiresAt,
      tokenId: tokens.refreshTokenId,
      userId: user.id,
    });

    return {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      user: authenticatedUser,
    };
  }
}

export class RefreshTokenUseCase {
  constructor(
    private readonly usersRepository: IUserRepository,
    private readonly tokenService: ITokenService,
    private readonly refreshSessionRepository: IRefreshSessionRepository,
  ) {}

  async execute(refreshToken?: string) {
    if (!refreshToken) {
      throw invalidRefreshToken();
    }

    const payload = await verifyRefreshToken(refreshToken, this.tokenService);

    if (!payload.jti) {
      throw invalidRefreshToken();
    }

    const refreshSession = await this.refreshSessionRepository.findByTokenId(payload.jti);

    if (
      !refreshSession ||
      refreshSession.userId !== payload.sub ||
      refreshSession.revokedAt !== null ||
      refreshSession.expiresAt.getTime() <= Date.now()
    ) {
      throw invalidRefreshToken();
    }

    const user = await this.usersRepository.findById(payload.sub);

    if (!user) {
      throw invalidRefreshToken();
    }

    await this.refreshSessionRepository.cleanupExpiredAndRevoked({ userId: user.id });
    const revokedAt = new Date();
    const tokens = await prepareTokens(
      {
        id: user.id,
        email: user.email.value,
        role: user.role,
      },
      this.tokenService,
    );
    const rotated = await this.refreshSessionRepository.rotate({
      currentTokenId: payload.jti,
      replacementExpiresAt: tokens.refreshTokenExpiresAt,
      replacementTokenId: tokens.refreshTokenId,
      revokedAt,
      userId: user.id,
    });

    if (!rotated) {
      throw invalidRefreshToken();
    }

    return {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
    };
  }
}

export class RevokeTokenUseCase {
  constructor(
    private readonly tokenService: ITokenService,
    private readonly refreshSessionRepository: IRefreshSessionRepository,
  ) {}

  async execute(refreshToken?: string) {
    if (!refreshToken) {
      return;
    }

    try {
      const payload = await verifyRefreshToken(refreshToken, this.tokenService);

      if (!payload.jti) {
        return;
      }

      await this.refreshSessionRepository.revokeIfActive({
        revokedAt: new Date(),
        tokenId: payload.jti,
      });
    } catch {
      return;
    }
  }
}

async function prepareTokens(user: AuthenticatedUser, tokenService: ITokenService) {
  const refreshTokenId = randomUUID();
  const refreshTokenExpiresIn = process.env.JWT_REFRESH_EXPIRES_IN as StringValue;
  const refreshTokenExpiresAt = new Date(
    Date.now() + parseDurationToMilliseconds(refreshTokenExpiresIn),
  );

  const [accessToken, refreshToken] = await Promise.all([
    tokenService.signAccessToken({
      email: user.email,
      role: user.role,
      sub: user.id,
    }),
    tokenService.signRefreshToken({
      email: user.email,
      jti: refreshTokenId,
      role: user.role,
      sub: user.id,
    }),
  ]);

  return {
    accessToken,
    refreshToken,
    refreshTokenExpiresAt,
    refreshTokenId,
  };
}

async function verifyRefreshToken(refreshToken: string, tokenService: ITokenService) {
  try {
    return await tokenService.verifyRefreshToken(refreshToken);
  } catch {
    throw invalidRefreshToken();
  }
}

function invalidCredentials() {
  return new AppException(401, AppErrorCode.INVALID_CREDENTIALS, 'Email ou senha invalidos', []);
}

function invalidRefreshToken() {
  return new AppException(
    401,
    AppErrorCode.INVALID_REFRESH_TOKEN,
    'Refresh token invalido ou expirado',
    [],
  );
}
