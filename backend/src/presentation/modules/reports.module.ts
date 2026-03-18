import { Module } from '@nestjs/common';
import {
  GetAverageDeliveryTimeUseCase,
  GetOrdersByStatusUseCase,
  GetRevenueByPeriodUseCase,
  GetTopProductsUseCase,
} from '../../application/reports/reports.use-cases';
import { APPLICATION_TOKENS } from '../../application/tokens';
import { PrismaAnalyticsRepository } from '../../infrastructure/prisma/prisma-analytics.repository';
import { PrismaModule } from '../../prisma/prisma.module';
import { ReportsController } from '../controllers/reports.controller';

@Module({
  controllers: [ReportsController],
  imports: [PrismaModule],
  providers: [
    {
      provide: APPLICATION_TOKENS.ANALYTICS_REPOSITORY,
      useClass: PrismaAnalyticsRepository,
    },
    {
      provide: GetRevenueByPeriodUseCase,
      useFactory: (analyticsRepository: PrismaAnalyticsRepository) =>
        new GetRevenueByPeriodUseCase(analyticsRepository),
      inject: [APPLICATION_TOKENS.ANALYTICS_REPOSITORY],
    },
    {
      provide: GetOrdersByStatusUseCase,
      useFactory: (analyticsRepository: PrismaAnalyticsRepository) =>
        new GetOrdersByStatusUseCase(analyticsRepository),
      inject: [APPLICATION_TOKENS.ANALYTICS_REPOSITORY],
    },
    {
      provide: GetTopProductsUseCase,
      useFactory: (analyticsRepository: PrismaAnalyticsRepository) =>
        new GetTopProductsUseCase(analyticsRepository),
      inject: [APPLICATION_TOKENS.ANALYTICS_REPOSITORY],
    },
    {
      provide: GetAverageDeliveryTimeUseCase,
      useFactory: (analyticsRepository: PrismaAnalyticsRepository) =>
        new GetAverageDeliveryTimeUseCase(analyticsRepository),
      inject: [APPLICATION_TOKENS.ANALYTICS_REPOSITORY],
    },
  ],
})
export class ReportsModule {}
