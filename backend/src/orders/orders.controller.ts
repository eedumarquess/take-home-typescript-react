import { Body, Controller, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { Roles } from '../common/decorators/roles.decorator';
import { AppRole } from '../common/enums/app-role.enum';
import { AssignDeliveryPersonDto } from './dto/assign-delivery-person.dto';
import { CreateOrderDto } from './dto/create-order.dto';
import { ListOrdersQueryDto } from './dto/list-orders-query.dto';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';
import { OrdersService } from './orders.service';

@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Get()
  @Roles(AppRole.ADMIN, AppRole.VIEWER)
  list(@Query() query: ListOrdersQueryDto) {
    return this.ordersService.list(query);
  }

  @Get(':id')
  @Roles(AppRole.ADMIN, AppRole.VIEWER)
  getById(@Param('id') id: string) {
    return this.ordersService.getById(id);
  }

  @Post()
  @Roles(AppRole.ADMIN)
  create(@Body() body: CreateOrderDto) {
    return this.ordersService.create(body);
  }

  @Patch(':id/status')
  @Roles(AppRole.ADMIN)
  updateStatus(@Param('id') id: string, @Body() body: UpdateOrderStatusDto) {
    return this.ordersService.updateStatus(id, body);
  }

  @Patch(':id/assign')
  @Roles(AppRole.ADMIN)
  assignDeliveryPerson(@Param('id') id: string, @Body() body: AssignDeliveryPersonDto) {
    return this.ordersService.assignDeliveryPerson(id, body);
  }
}
