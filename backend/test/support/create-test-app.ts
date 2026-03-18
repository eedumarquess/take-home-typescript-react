import type { INestApplication } from '@nestjs/common';
import { Controller, Get, Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Test } from '@nestjs/testing';
import { Prisma, type RefreshSession, type User } from '@prisma/client';
import { AppModule } from '../../src/app.module';
import { configureApp } from '../../src/bootstrap/configure-app';
import { Public } from '../../src/common/decorators/public.decorator';
import { Roles } from '../../src/common/decorators/roles.decorator';
import { AppRole } from '../../src/common/enums/app-role.enum';
import type { TokenPayload } from '../../src/common/interfaces/token-payload.interface';
import { PrismaService } from '../../src/prisma/prisma.service';

type TestAppOptions = {
  env?: Partial<Record<string, string>>;
  prismaOverrides?: Record<string, unknown>;
  users?: User[];
  refreshSessions?: RefreshSession[];
};

type TestAppStores = {
  refreshSessions: RefreshSession[];
  users: User[];
};

type TestAppContext = {
  app: INestApplication;
  issueAccessToken: (payload: Omit<TokenPayload, 'iat' | 'exp'>) => Promise<string>;
  prismaMock: Record<string, unknown>;
  stores: TestAppStores;
};

@Controller('security-probe')
class SecurityProbeController {
  @Public()
  @Get('public')
  getPublic() {
    return {
      status: 'ok',
    };
  }

  @Get('protected')
  getProtected() {
    return {
      status: 'ok',
    };
  }

  @Roles(AppRole.ADMIN)
  @Get('admin')
  getAdmin() {
    return {
      status: 'ok',
    };
  }
}

@Module({
  controllers: [SecurityProbeController],
})
class SecurityProbeTestModule {}

export async function createTestApp(options: TestAppOptions = {}): Promise<TestAppContext> {
  applyEnvironmentOverrides(options.env);

  const stores: TestAppStores = {
    refreshSessions: [...(options.refreshSessions ?? [])],
    users: [...(options.users ?? [])],
  };

  let prismaMock: Record<string, unknown>;

  const basePrismaMock: Record<string, unknown> = {
    $transaction: jest.fn((arg: unknown): unknown => {
      if (typeof arg === 'function') {
        return arg(prismaMock);
      }

      return Promise.all(arg as Array<Promise<unknown>>);
    }),
    $queryRaw: jest.fn().mockResolvedValue([{ ok: 1 }]),
    refreshSession: {
      create: jest.fn(
        ({
          data,
        }: {
          data: {
            expiresAt: Date;
            replacedByTokenId?: string | null;
            tokenId: string;
            userId: string;
          };
        }) => {
          const session: RefreshSession = {
            id: `refresh-session-${stores.refreshSessions.length + 1}`,
            userId: data.userId,
            tokenId: data.tokenId,
            expiresAt: data.expiresAt,
            revokedAt: null,
            replacedByTokenId: data.replacedByTokenId ?? null,
            createdAt: new Date(),
          };

          stores.refreshSessions.push(session);

          return Promise.resolve(session);
        },
      ),
      findUnique: jest.fn(({ where }: { where: { tokenId: string } }) =>
        Promise.resolve(
          stores.refreshSessions.find((session) => session.tokenId === where.tokenId) ?? null,
        ),
      ),
      update: jest.fn(
        ({ where, data }: { where: { tokenId: string }; data: Partial<RefreshSession> }) => {
          const session = stores.refreshSessions.find((entry) => entry.tokenId === where.tokenId);

          if (!session) {
            return Promise.resolve(null);
          }

          Object.assign(session, data);

          return Promise.resolve(session);
        },
      ),
      updateMany: jest.fn(
        ({
          where,
          data,
        }: {
          where: {
            expiresAt?: { gt?: Date };
            revokedAt?: null;
            tokenId?: string;
            userId?: string;
          };
          data: Partial<RefreshSession>;
        }) => {
          const matchingSessions = stores.refreshSessions.filter((session) => {
            if (where.tokenId && session.tokenId !== where.tokenId) {
              return false;
            }

            if (where.userId && session.userId !== where.userId) {
              return false;
            }

            if (where.revokedAt === null && session.revokedAt !== null) {
              return false;
            }

            if (where.expiresAt?.gt && session.expiresAt <= where.expiresAt.gt) {
              return false;
            }

            return true;
          });

          for (const session of matchingSessions) {
            Object.assign(session, data);
          }

          return Promise.resolve({ count: matchingSessions.length });
        },
      ),
      deleteMany: jest.fn(
        ({
          where,
        }: {
          where?: {
            OR?: Array<{ expiresAt?: { lte?: Date }; revokedAt?: { not: null } }>;
            userId?: string;
          };
        }) => {
          const previousLength = stores.refreshSessions.length;

          stores.refreshSessions = stores.refreshSessions.filter((session) => {
            if (where?.userId && session.userId !== where.userId) {
              return true;
            }

            const matchesOr =
              where?.OR?.some((condition) => {
                if (condition.expiresAt?.lte && session.expiresAt <= condition.expiresAt.lte) {
                  return true;
                }

                if (condition.revokedAt?.not === null && session.revokedAt !== null) {
                  return true;
                }

                return false;
              }) ?? false;

            return !matchesOr;
          });

          return Promise.resolve({
            count: previousLength - stores.refreshSessions.length,
          });
        },
      ),
    },
    user: {
      findUnique: jest.fn(({ where }: { where: { email?: string; id?: string } }) =>
        Promise.resolve(
          stores.users.find((user) => {
            if (where.email) {
              return user.email === where.email;
            }

            if (where.id) {
              return user.id === where.id;
            }

            return false;
          }) ?? null,
        ),
      ),
      findFirst: jest.fn(
        ({
          where,
        }: {
          where: {
            email?: {
              equals?: string;
              mode?: string;
            };
          };
        }) =>
          Promise.resolve(
            stores.users.find((user) => {
              if (where.email?.equals) {
                return user.email.toLowerCase() === where.email.equals.toLowerCase();
              }

              return false;
            }) ?? null,
          ),
      ),
    },
    order: {
      aggregate: jest.fn().mockResolvedValue({
        _count: { _all: 0 },
        _max: { createdAt: null, deliveredAt: null },
        _min: { createdAt: null, deliveredAt: null },
        _sum: { totalAmount: new Prisma.Decimal('0') },
      }),
      count: jest.fn().mockResolvedValue(0),
      findUnique: jest.fn().mockResolvedValue(null),
      findUniqueOrThrow: jest.fn().mockRejectedValue(new Error('Not found')),
      findMany: jest.fn().mockResolvedValue([]),
      groupBy: jest.fn().mockResolvedValue([]),
      updateMany: jest.fn().mockResolvedValue({ count: 0 }),
    },
  };
  prismaMock = {
    ...basePrismaMock,
    ...options.prismaOverrides,
  };

  const moduleRef = await Test.createTestingModule({
    imports: [AppModule, SecurityProbeTestModule],
  })
    .overrideProvider(PrismaService)
    .useValue(prismaMock)
    .compile();

  const app = moduleRef.createNestApplication();

  configureApp(app);
  await app.init();

  const jwtService = app.get(JwtService);
  const configService = app.get(ConfigService);

  return {
    app,
    async issueAccessToken(payload) {
      return jwtService.signAsync(payload, {
        secret: configService.getOrThrow<string>('JWT_SECRET'),
      });
    },
    prismaMock,
    stores,
  };
}

function applyEnvironmentOverrides(overrides?: Partial<Record<string, string>>) {
  const defaults: Record<string, string> = {
    COOKIE_SECURE: 'false',
    DATABASE_URL: 'postgresql://fastmeals:fastmeals@localhost:5432/fastmeals_test',
    FRONTEND_URL: 'http://localhost:3000',
    JWT_EXPIRES_IN: '15m',
    JWT_REFRESH_EXPIRES_IN: '7d',
    JWT_REFRESH_SECRET: 'test-refresh-secret',
    JWT_SECRET: 'test-secret',
    NODE_ENV: 'test',
    PORT: '3001',
    THROTTLE_LIMIT: '100',
    THROTTLE_TTL_SECONDS: '60',
  };

  for (const [key, value] of Object.entries({
    ...defaults,
    ...overrides,
  })) {
    process.env[key] = value;
  }
}
