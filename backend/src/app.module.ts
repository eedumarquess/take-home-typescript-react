import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_FILTER, APP_GUARD } from '@nestjs/core';
import { AuthModule } from './auth/auth.module';
import { validateEnvironment } from './common/config/env.validation';
import { AppExceptionFilter } from './common/filters/app-exception.filter';
import { AccessTokenGuard } from './common/guards/access-token.guard';
import { RateLimitGuard } from './common/guards/rate-limit.guard';
import { RolesGuard } from './common/guards/roles.guard';
import { DeliveryPersonsModule } from './delivery-persons/delivery-persons.module';
import { HealthModule } from './health/health.module';
import { OptimizationModule } from './optimization/optimization.module';
import { OrdersModule } from './orders/orders.module';
import { PrismaModule } from './prisma/prisma.module';
import { ProductsModule } from './products/products.module';
import { ReportsModule } from './reports/reports.module';
import { UsersModule } from './users/users.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['../.env', '.env'],
      validate: validateEnvironment,
    }),
    PrismaModule,
    HealthModule,
    AuthModule,
    UsersModule,
    ProductsModule,
    OrdersModule,
    DeliveryPersonsModule,
    ReportsModule,
    OptimizationModule,
  ],
  providers: [
    {
      provide: APP_FILTER,
      useClass: AppExceptionFilter,
    },
    {
      provide: APP_GUARD,
      useClass: RateLimitGuard,
    },
    {
      provide: APP_GUARD,
      useClass: AccessTokenGuard,
    },
    {
      provide: APP_GUARD,
      useClass: RolesGuard,
    },
  ],
})
export class AppModule {}
