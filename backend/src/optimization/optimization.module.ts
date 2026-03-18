import { Module } from '@nestjs/common';
import { DeliveryPersonsRepository } from '../delivery-persons/delivery-persons.repository';
import { OrdersRepository } from '../orders/orders.repository';
import { OptimizationController } from './optimization.controller';
import { OptimizationRepository } from './optimization.repository';
import { OptimizationService } from './optimization.service';

@Module({
  controllers: [OptimizationController],
  providers: [
    DeliveryPersonsRepository,
    OptimizationRepository,
    OptimizationService,
    OrdersRepository,
  ],
  exports: [OptimizationService],
})
export class OptimizationModule {}
