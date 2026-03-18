import type { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { AppModule } from '../../src/app.module';
import { configureApp } from '../../src/bootstrap/configure-app';
import { PrismaService } from '../../src/prisma/prisma.service';

type TestAppOptions = {
  env?: Partial<Record<string, string>>;
  prismaOverrides?: Record<string, unknown>;
};

type TestAppContext = {
  app: INestApplication;
  prismaMock: Record<string, unknown>;
};

export async function createTestApp(options: TestAppOptions = {}): Promise<TestAppContext> {
  applyEnvironmentOverrides(options.env);

  const prismaMock = {
    $queryRaw: jest.fn().mockResolvedValue([{ ok: 1 }]),
    user: {
      findUnique: jest.fn(),
    },
    ...options.prismaOverrides,
  };

  const moduleRef = await Test.createTestingModule({
    imports: [AppModule],
  })
    .overrideProvider(PrismaService)
    .useValue(prismaMock)
    .compile();

  const app = moduleRef.createNestApplication();

  configureApp(app);
  await app.init();

  return {
    app,
    prismaMock,
  };
}

function applyEnvironmentOverrides(overrides?: Partial<Record<string, string>>) {
  const defaults: Record<string, string> = {
    DATABASE_URL: 'postgresql://fastmeals:fastmeals@localhost:5432/fastmeals_test',
    JWT_SECRET: 'test-secret',
    JWT_REFRESH_SECRET: 'test-refresh-secret',
    JWT_EXPIRES_IN: '15m',
    JWT_REFRESH_EXPIRES_IN: '7d',
    PORT: '3001',
    NODE_ENV: 'test',
    FRONTEND_URL: 'http://localhost:3000',
    THROTTLE_TTL_SECONDS: '60',
    THROTTLE_LIMIT: '100',
    COOKIE_SECURE: 'false',
  };

  for (const [key, value] of Object.entries({
    ...defaults,
    ...overrides,
  })) {
    process.env[key] = value;
  }
}
