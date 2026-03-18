import { Module } from '@nestjs/common';
import { DeliveryPersonsService } from './delivery-persons.service';

@Module({
  providers: [DeliveryPersonsService],
  exports: [DeliveryPersonsService],
})
export class DeliveryPersonsModule {}
