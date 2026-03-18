import { Body, Controller, Get, Param, Patch, Post, Query } from '@nestjs/common';
import {
  AssignDeliveryUseCase,
  CreateOrderUseCase,
  GetOrderDetailsUseCase,
  ListOrdersUseCase,
  TransitionOrderUseCase,
} from '../../application/orders/orders.use-cases';
import { Roles } from '../../common/decorators/roles.decorator';
import { AppRole } from '../../common/enums/app-role.enum';
import { AssignDeliveryPersonDto } from '../dto/orders/assign-delivery-person.dto';
import { CreateOrderDto } from '../dto/orders/create-order.dto';
import { ListOrdersQueryDto } from '../dto/orders/list-orders-query.dto';
import { UpdateOrderStatusDto } from '../dto/orders/update-order-status.dto';

@Controller('orders')
export class OrdersController {
  constructor(
    private readonly listOrdersUseCase: ListOrdersUseCase,
    private readonly getOrderDetailsUseCase: GetOrderDetailsUseCase,
    private readonly createOrderUseCase: CreateOrderUseCase,
    private readonly transitionOrderUseCase: TransitionOrderUseCase,
    private readonly assignDeliveryUseCase: AssignDeliveryUseCase,
  ) {}

  @Get()
  @Roles(AppRole.ADMIN, AppRole.VIEWER)
  list(@Query() query: ListOrdersQueryDto) {
    return this.listOrdersUseCase.execute(query);
  }

  @Get(':id')
  @Roles(AppRole.ADMIN, AppRole.VIEWER)
  getById(@Param('id') id: string) {
    return this.getOrderDetailsUseCase.execute(id);
  }

  @Post()
  @Roles(AppRole.ADMIN)
  create(@Body() body: CreateOrderDto) {
    return this.createOrderUseCase.execute(body);
  }

  @Patch(':id/status')
  @Roles(AppRole.ADMIN)
  updateStatus(@Param('id') id: string, @Body() body: UpdateOrderStatusDto) {
    return this.transitionOrderUseCase.execute(id, body);
  }

  @Patch(':id/assign')
  @Roles(AppRole.ADMIN)
  assignDeliveryPerson(@Param('id') id: string, @Body() body: AssignDeliveryPersonDto) {
    return this.assignDeliveryUseCase.execute(id, body);
  }
}
