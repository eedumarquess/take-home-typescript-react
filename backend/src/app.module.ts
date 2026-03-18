import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_FILTER, APP_GUARD } from '@nestjs/core';
import { validateEnvironment } from './common/config/env.validation';
import { AppExceptionFilter } from './common/filters/app-exception.filter';
import { AccessTokenGuard } from './common/guards/access-token.guard';
import { RateLimitGuard } from './common/guards/rate-limit.guard';
import { RolesGuard } from './common/guards/roles.guard';
import { HealthModule } from './health/health.module';
import { AuthModule } from './presentation/modules/auth.module';
import { DeliveryPersonsModule } from './presentation/modules/delivery-persons.module';
import { OrdersModule } from './presentation/modules/orders.module';
import { ProductsModule } from './presentation/modules/products.module';
import { ReportsModule } from './presentation/modules/reports.module';
import { PrismaModule } from './prisma/prisma.module';

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
    ProductsModule,
    OrdersModule,
    DeliveryPersonsModule,
    ReportsModule,
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
