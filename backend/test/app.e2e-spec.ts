import request from 'supertest';
import { createTestApp } from './support/create-test-app';

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
});
