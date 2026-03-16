import { ConfigService } from '@nestjs/config';
import { Test, type TestingModule } from '@nestjs/testing';
import { AppController } from './app.controller';
import { AppService } from './app.service';

describe('AppController', () => {
  let appController: AppController;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
      providers: [
        AppService,
        {
          provide: ConfigService,
          useValue: {
            get: (key: string) => (key === 'NODE_ENV' ? 'test' : undefined),
          },
        },
      ],
    }).compile();

    appController = app.get<AppController>(AppController);
  });

  describe('health', () => {
    it('should return the current API status payload', () => {
      expect(appController.getHealth()).toEqual({
        status: 'ok',
        service: 'fastmeals-api',
        environment: 'test',
        database: 'prisma-configured',
      });
    });
  });
});
