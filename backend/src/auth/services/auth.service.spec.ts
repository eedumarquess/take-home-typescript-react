import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Test, type TestingModule } from '@nestjs/testing';
import { UserRole } from '@prisma/client';
import { hash } from 'bcrypt';
import { AppRole } from '../../common/enums/app-role.enum';
import { UsersService } from '../../users/services/users.service';
import { RefreshSessionsRepository } from '../repositories/refresh-sessions.repository';
import { AuthService } from './auth.service';

describe('AuthService', () => {
  let authService: AuthService;
  const usersService = {
    findByEmail: jest.fn(),
    findById: jest.fn(),
  };
  const jwtService = {
    signAsync: jest.fn(),
    verifyAsync: jest.fn(),
  };
  const refreshSessionsRepository = {
    create: jest.fn(),
    findByTokenId: jest.fn(),
    revoke: jest.fn(),
  };
  const configService = {
    getOrThrow: jest.fn((key: string) => {
      const values: Record<string, string> = {
        JWT_SECRET: 'test-secret',
        JWT_REFRESH_SECRET: 'test-refresh-secret',
        JWT_EXPIRES_IN: '15m',
        JWT_REFRESH_EXPIRES_IN: '7d',
      };

      return values[key];
    }),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const moduleRef: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: UsersService,
          useValue: usersService,
        },
        {
          provide: JwtService,
          useValue: jwtService,
        },
        {
          provide: ConfigService,
          useValue: configService,
        },
        {
          provide: RefreshSessionsRepository,
          useValue: refreshSessionsRepository,
        },
      ],
    }).compile();

    authService = moduleRef.get(AuthService);
  });

  it('returns access and refresh tokens for valid credentials', async () => {
    const password = await hash('Admin@123', 10);

    usersService.findByEmail.mockResolvedValue({
      id: 'user-1',
      email: 'admin@fastmeals.com',
      password,
      role: UserRole.ADMIN,
    });
    jwtService.signAsync
      .mockResolvedValueOnce('access-token')
      .mockResolvedValueOnce('refresh-token');

    await expect(
      authService.login({
        email: 'admin@fastmeals.com',
        password: 'Admin@123',
      }),
    ).resolves.toEqual({
      accessToken: 'access-token',
      refreshToken: 'refresh-token',
      user: {
        id: 'user-1',
        email: 'admin@fastmeals.com',
        role: AppRole.ADMIN,
      },
    });
    expect(refreshSessionsRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: 'user-1',
        tokenId: expect.any(String),
      }),
    );
  });

  it('throws INVALID_CREDENTIALS when the password is invalid', async () => {
    const password = await hash('Admin@123', 10);

    usersService.findByEmail.mockResolvedValue({
      id: 'user-1',
      email: 'admin@fastmeals.com',
      password,
      role: UserRole.ADMIN,
    });

    await expect(
      authService.login({
        email: 'admin@fastmeals.com',
        password: 'wrong-password',
      }),
    ).rejects.toMatchObject({
      response: {
        error: {
          code: 'INVALID_CREDENTIALS',
        },
      },
    });
  });

  it('rotates the refresh session and revokes the previous token on refresh', async () => {
    jwtService.verifyAsync.mockResolvedValue({
      sub: 'user-1',
      email: 'admin@fastmeals.com',
      role: AppRole.ADMIN,
      jti: 'refresh-token-1',
    });
    refreshSessionsRepository.findByTokenId.mockResolvedValue({
      userId: 'user-1',
      expiresAt: new Date(Date.now() + 60_000),
      revokedAt: null,
    });
    usersService.findById.mockResolvedValue({
      id: 'user-1',
      email: 'admin@fastmeals.com',
      role: UserRole.ADMIN,
    });
    jwtService.signAsync
      .mockResolvedValueOnce('next-access-token')
      .mockResolvedValueOnce('next-refresh-token');

    await expect(authService.refresh('refresh-cookie')).resolves.toEqual({
      accessToken: 'next-access-token',
      refreshToken: 'next-refresh-token',
    });
    expect(refreshSessionsRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: 'user-1',
        tokenId: expect.any(String),
      }),
    );
    expect(refreshSessionsRepository.revoke).toHaveBeenCalledWith(
      expect.objectContaining({
        tokenId: 'refresh-token-1',
        replacedByTokenId: expect.any(String),
      }),
    );
  });

  it('rejects refresh token reuse after revocation', async () => {
    jwtService.verifyAsync.mockResolvedValue({
      sub: 'user-1',
      email: 'admin@fastmeals.com',
      role: AppRole.ADMIN,
      jti: 'revoked-token',
    });
    refreshSessionsRepository.findByTokenId.mockResolvedValue({
      userId: 'user-1',
      expiresAt: new Date(Date.now() + 60_000),
      revokedAt: new Date(),
    });

    await expect(authService.refresh('stale-token')).rejects.toMatchObject({
      response: {
        error: {
          code: 'INVALID_REFRESH_TOKEN',
        },
      },
    });
  });

  it('revokes the current refresh session on logout', async () => {
    jwtService.verifyAsync.mockResolvedValue({
      sub: 'user-1',
      email: 'admin@fastmeals.com',
      role: AppRole.ADMIN,
      jti: 'refresh-token-logout',
    });

    await expect(authService.logout('refresh-cookie')).resolves.toBeUndefined();
    expect(refreshSessionsRepository.revoke).toHaveBeenCalledWith(
      expect.objectContaining({
        tokenId: 'refresh-token-logout',
      }),
    );
  });
});
