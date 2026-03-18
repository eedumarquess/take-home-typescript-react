import { UserRole } from '@prisma/client';
import { hash } from 'bcrypt';
import request from 'supertest';
import { AppRole } from '../src/common/enums/app-role.enum';
import { createTestApp } from './support/create-test-app';

function extractCookie(cookies: string | string[] | undefined, cookieName: string) {
  const cookieEntries = Array.isArray(cookies) ? cookies : cookies ? [cookies] : [];
  const rawCookie = cookieEntries.find((entry) => entry.startsWith(`${cookieName}=`));

  return rawCookie?.split(';')[0];
}

describe('Foundation (e2e)', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('/api/health (GET) returns database-connected health payload', async () => {
    const { app } = await createTestApp();

    await request(app.getHttpServer()).get('/api/health').expect(200).expect({
      status: 'ok',
      service: 'fastmeals-api',
      environment: 'test',
      database: 'connected',
    });

    await app.close();
  });

  it('/api/auth/login (POST) uses the global validation contract', async () => {
    const { app } = await createTestApp();

    await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ email: 'invalid-email' })
      .expect(400)
      .expect(({ body }) => {
        expect(body).toMatchObject({
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Dados invalidos',
          },
        });
        expect(body.error.details).toEqual(
          expect.arrayContaining([
            expect.objectContaining({
              field: 'email',
            }),
            expect.objectContaining({
              field: 'password',
            }),
          ]),
        );
      });

    await app.close();
  });

  it('/api/auth/login (POST) returns access token and refresh cookie for valid credentials', async () => {
    const passwordHash = await hash('Admin@123', 10);
    const { app } = await createTestApp({
      users: [
        {
          createdAt: new Date(),
          email: 'admin@fastmeals.com',
          id: 'user-admin',
          password: passwordHash,
          role: UserRole.ADMIN,
          updatedAt: new Date(),
        },
      ],
    });

    await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({
        email: 'admin@fastmeals.com',
        password: 'Admin@123',
      })
      .expect(200)
      .expect(({ body, headers }) => {
        expect(body).toMatchObject({
          accessToken: expect.any(String),
          user: {
            id: 'user-admin',
            email: 'admin@fastmeals.com',
            role: 'admin',
          },
        });
        expect(headers['set-cookie']).toEqual(
          expect.arrayContaining([
            expect.stringContaining('refreshToken='),
            expect.stringContaining('HttpOnly'),
            expect.stringContaining('Path=/api/auth'),
            expect.stringContaining('SameSite=Strict'),
          ]),
        );
      });

    await app.close();
  });

  it('/api/auth/login (POST) rejects invalid credentials with 401', async () => {
    const passwordHash = await hash('Admin@123', 10);
    const { app } = await createTestApp({
      users: [
        {
          createdAt: new Date(),
          email: 'admin@fastmeals.com',
          id: 'user-admin',
          password: passwordHash,
          role: UserRole.ADMIN,
          updatedAt: new Date(),
        },
      ],
    });

    await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({
        email: 'admin@fastmeals.com',
        password: 'wrong-password',
      })
      .expect(401)
      .expect({
        error: {
          code: 'INVALID_CREDENTIALS',
          message: 'Email ou senha invalidos',
          details: [],
        },
      });

    await app.close();
  });

  it('/api/auth/refresh (POST) rotates the refresh cookie and keeps one active session', async () => {
    const passwordHash = await hash('Admin@123', 10);
    const { app, stores } = await createTestApp({
      users: [
        {
          createdAt: new Date(),
          email: 'admin@fastmeals.com',
          id: 'user-admin',
          password: passwordHash,
          role: UserRole.ADMIN,
          updatedAt: new Date(),
        },
      ],
    });

    const loginResponse = await request(app.getHttpServer()).post('/api/auth/login').send({
      email: 'admin@fastmeals.com',
      password: 'Admin@123',
    });
    const initialCookie = extractCookie(loginResponse.headers['set-cookie'], 'refreshToken');

    const refreshResponse = await request(app.getHttpServer())
      .post('/api/auth/refresh')
      .set('Cookie', initialCookie ? [initialCookie] : [])
      .expect(200);
    const rotatedCookie = extractCookie(refreshResponse.headers['set-cookie'], 'refreshToken');

    expect(refreshResponse.body).toMatchObject({
      accessToken: expect.any(String),
    });
    expect(rotatedCookie).toBeDefined();
    expect(rotatedCookie).not.toEqual(initialCookie);
    expect(stores.refreshSessions).toHaveLength(2);
    expect(stores.refreshSessions.filter((session) => session.revokedAt === null)).toHaveLength(1);
    expect(stores.refreshSessions.filter((session) => session.revokedAt !== null)).toHaveLength(1);

    await app.close();
  });

  it('/api/auth/refresh (POST) rejects invalid refresh tokens with 401', async () => {
    const { app } = await createTestApp();

    await request(app.getHttpServer())
      .post('/api/auth/refresh')
      .set('Cookie', ['refreshToken=invalid-refresh-token'])
      .expect(401)
      .expect({
        error: {
          code: 'INVALID_REFRESH_TOKEN',
          message: 'Refresh token invalido ou expirado',
          details: [],
        },
      });

    await app.close();
  });

  it('/api/auth/logout (POST) revokes the active session and clears the cookie', async () => {
    const passwordHash = await hash('Admin@123', 10);
    const { app, stores } = await createTestApp({
      users: [
        {
          createdAt: new Date(),
          email: 'admin@fastmeals.com',
          id: 'user-admin',
          password: passwordHash,
          role: UserRole.ADMIN,
          updatedAt: new Date(),
        },
      ],
    });

    const loginResponse = await request(app.getHttpServer()).post('/api/auth/login').send({
      email: 'admin@fastmeals.com',
      password: 'Admin@123',
    });
    const refreshCookie = extractCookie(loginResponse.headers['set-cookie'], 'refreshToken');

    await request(app.getHttpServer())
      .post('/api/auth/logout')
      .set('Cookie', refreshCookie ? [refreshCookie] : [])
      .expect(204)
      .expect(({ headers }) => {
        expect(headers['set-cookie']).toEqual(
          expect.arrayContaining([
            expect.stringContaining('refreshToken=;'),
            expect.stringContaining('Path=/api/auth'),
          ]),
        );
      });

    expect(stores.refreshSessions[0]?.revokedAt).toBeInstanceOf(Date);

    await app.close();
  });

  it('returns 401 INVALID_TOKEN for protected routes without a bearer token', async () => {
    const { app } = await createTestApp();

    await request(app.getHttpServer())
      .get('/api/security-probe/protected')
      .expect(401)
      .expect({
        error: {
          code: 'INVALID_TOKEN',
          message: 'Token mal formado ou invalido',
          details: [],
        },
      });

    await app.close();
  });

  it('returns 403 FORBIDDEN when a viewer token hits an admin-only route', async () => {
    const { app, issueAccessToken } = await createTestApp();
    const viewerToken = await issueAccessToken({
      email: 'viewer@fastmeals.com',
      role: AppRole.VIEWER,
      sub: 'user-viewer',
    });

    await request(app.getHttpServer())
      .get('/api/security-probe/admin')
      .set('Authorization', `Bearer ${viewerToken}`)
      .expect(403)
      .expect({
        error: {
          code: 'FORBIDDEN',
          message: 'Permissao insuficiente para a acao',
          details: [],
        },
      });

    await app.close();
  });

  it('returns 429 RATE_LIMIT_EXCEEDED after the configured per-IP threshold', async () => {
    const { app } = await createTestApp();
    const httpServer = app.getHttpServer();
    const ipAddress = '203.0.113.10';

    for (let attempt = 0; attempt < 100; attempt += 1) {
      await request(httpServer).get('/api/security-probe/public').set('X-Forwarded-For', ipAddress);
    }

    await request(httpServer)
      .get('/api/security-probe/public')
      .set('X-Forwarded-For', ipAddress)
      .expect(429)
      .expect({
        error: {
          code: 'RATE_LIMIT_EXCEEDED',
          message: 'Limite de requisicoes atingido',
          details: [],
        },
      });

    await app.close();
  });
});
