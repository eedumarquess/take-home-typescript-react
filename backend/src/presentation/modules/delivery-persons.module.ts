import { Module } from '@nestjs/common';
import {
  CreateDeliveryPersonUseCase,
  DeleteDeliveryPersonUseCase,
  GetDeliveryPersonUseCase,
  ListDeliveryPersonsUseCase,
  UpdateDeliveryPersonUseCase,
} from '../../application/delivery-persons/delivery-persons.use-cases';
import { APPLICATION_TOKENS } from '../../application/tokens';
import { PrismaDeliveryPersonRepository } from '../../infrastructure/prisma/prisma-delivery-person.repository';
import { PrismaModule } from '../../prisma/prisma.module';
import { DeliveryPersonsController } from '../controllers/delivery-persons.controller';

@Module({
  controllers: [DeliveryPersonsController],
  imports: [PrismaModule],
  providers: [
    {
      provide: APPLICATION_TOKENS.DELIVERY_PERSON_REPOSITORY,
      useClass: PrismaDeliveryPersonRepository,
    },
    {
      provide: ListDeliveryPersonsUseCase,
      useFactory: (deliveryPersonsRepository: PrismaDeliveryPersonRepository) =>
        new ListDeliveryPersonsUseCase(deliveryPersonsRepository),
      inject: [APPLICATION_TOKENS.DELIVERY_PERSON_REPOSITORY],
    },
    {
      provide: GetDeliveryPersonUseCase,
      useFactory: (deliveryPersonsRepository: PrismaDeliveryPersonRepository) =>
        new GetDeliveryPersonUseCase(deliveryPersonsRepository),
      inject: [APPLICATION_TOKENS.DELIVERY_PERSON_REPOSITORY],
    },
    {
      provide: CreateDeliveryPersonUseCase,
      useFactory: (deliveryPersonsRepository: PrismaDeliveryPersonRepository) =>
        new CreateDeliveryPersonUseCase(deliveryPersonsRepository),
      inject: [APPLICATION_TOKENS.DELIVERY_PERSON_REPOSITORY],
    },
    {
      provide: UpdateDeliveryPersonUseCase,
      useFactory: (deliveryPersonsRepository: PrismaDeliveryPersonRepository) =>
        new UpdateDeliveryPersonUseCase(deliveryPersonsRepository),
      inject: [APPLICATION_TOKENS.DELIVERY_PERSON_REPOSITORY],
    },
    {
      provide: DeleteDeliveryPersonUseCase,
      useFactory: (deliveryPersonsRepository: PrismaDeliveryPersonRepository) =>
        new DeleteDeliveryPersonUseCase(deliveryPersonsRepository),
      inject: [APPLICATION_TOKENS.DELIVERY_PERSON_REPOSITORY],
    },
  ],
})
export class DeliveryPersonsModule {}
