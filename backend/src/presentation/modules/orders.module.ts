import { Module } from '@nestjs/common';
import { OptimizeAssignmentUseCase } from '../../application/optimization/optimization.use-case';
import {
  AssignDeliveryUseCase,
  CreateOrderUseCase,
  GetOrderDetailsUseCase,
  ListOrdersUseCase,
  TransitionOrderUseCase,
} from '../../application/orders/orders.use-cases';
import { APPLICATION_TOKENS } from '../../application/tokens';
import { HungarianAssignmentAlgorithm } from '../../infrastructure/optimization/hungarian-assignment.algorithm';
import { PrismaDeliveryPersonRepository } from '../../infrastructure/prisma/prisma-delivery-person.repository';
import { PrismaOrderRepository } from '../../infrastructure/prisma/prisma-order.repository';
import { PrismaModule } from '../../prisma/prisma.module';
import { OptimizationController } from '../controllers/optimization.controller';
import { OrdersController } from '../controllers/orders.controller';

@Module({
  controllers: [OrdersController, OptimizationController],
  imports: [PrismaModule],
  providers: [
    {
      provide: APPLICATION_TOKENS.ORDER_REPOSITORY,
      useClass: PrismaOrderRepository,
    },
    {
      provide: APPLICATION_TOKENS.DELIVERY_PERSON_REPOSITORY,
      useClass: PrismaDeliveryPersonRepository,
    },
    {
      provide: APPLICATION_TOKENS.ASSIGNMENT_ALGORITHM,
      useClass: HungarianAssignmentAlgorithm,
    },
    {
      provide: ListOrdersUseCase,
      useFactory: (ordersRepository: PrismaOrderRepository) =>
        new ListOrdersUseCase(ordersRepository),
      inject: [APPLICATION_TOKENS.ORDER_REPOSITORY],
    },
    {
      provide: GetOrderDetailsUseCase,
      useFactory: (ordersRepository: PrismaOrderRepository) =>
        new GetOrderDetailsUseCase(ordersRepository),
      inject: [APPLICATION_TOKENS.ORDER_REPOSITORY],
    },
    {
      provide: CreateOrderUseCase,
      useFactory: (ordersRepository: PrismaOrderRepository) =>
        new CreateOrderUseCase(ordersRepository),
      inject: [APPLICATION_TOKENS.ORDER_REPOSITORY],
    },
    {
      provide: TransitionOrderUseCase,
      useFactory: (ordersRepository: PrismaOrderRepository) =>
        new TransitionOrderUseCase(ordersRepository),
      inject: [APPLICATION_TOKENS.ORDER_REPOSITORY],
    },
    {
      provide: AssignDeliveryUseCase,
      useFactory: (ordersRepository: PrismaOrderRepository) =>
        new AssignDeliveryUseCase(ordersRepository),
      inject: [APPLICATION_TOKENS.ORDER_REPOSITORY],
    },
    {
      provide: OptimizeAssignmentUseCase,
      useFactory: (
        ordersRepository: PrismaOrderRepository,
        deliveryPersonRepository: PrismaDeliveryPersonRepository,
        assignmentAlgorithm: HungarianAssignmentAlgorithm,
      ) =>
        new OptimizeAssignmentUseCase(
          ordersRepository,
          deliveryPersonRepository,
          assignmentAlgorithm,
        ),
      inject: [
        APPLICATION_TOKENS.ORDER_REPOSITORY,
        APPLICATION_TOKENS.DELIVERY_PERSON_REPOSITORY,
        APPLICATION_TOKENS.ASSIGNMENT_ALGORITHM,
      ],
    },
  ],
})
export class OrdersModule {}
