import { Module } from '@nestjs/common';
import { DeliveryPersonsController } from './delivery-persons.controller';
import { DeliveryPersonsRepository } from './delivery-persons.repository';
import { DeliveryPersonsService } from './delivery-persons.service';

@Module({
  controllers: [DeliveryPersonsController],
  providers: [DeliveryPersonsRepository, DeliveryPersonsService],
  exports: [DeliveryPersonsService],
})
export class DeliveryPersonsModule {}
