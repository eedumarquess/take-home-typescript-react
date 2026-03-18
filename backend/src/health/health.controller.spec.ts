import { Test, type TestingModule } from '@nestjs/testing';
import { HealthController } from './health.controller';
import { HealthService } from './health.service';

describe('HealthController', () => {
  let healthController: HealthController;

  beforeEach(async () => {
    const moduleRef: TestingModule = await Test.createTestingModule({
      controllers: [HealthController],
      providers: [
        {
          provide: HealthService,
          useValue: {
            getHealth: jest.fn().mockResolvedValue({
              status: 'ok',
              service: 'fastmeals-api',
              environment: 'test',
              database: 'connected',
            }),
          },
        },
      ],
    }).compile();

    healthController = moduleRef.get(HealthController);
  });

  it('returns the application health payload', async () => {
    await expect(healthController.getHealth()).resolves.toEqual({
      status: 'ok',
      service: 'fastmeals-api',
      environment: 'test',
      database: 'connected',
    });
  });
});
