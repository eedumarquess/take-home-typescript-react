import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Post, Put, Query } from '@nestjs/common';
import { Roles } from '../common/decorators/roles.decorator';
import { AppRole } from '../common/enums/app-role.enum';
import { CreateDeliveryPersonDto } from './dto/create-delivery-person.dto';
import { ListDeliveryPersonsQueryDto } from './dto/list-delivery-persons-query.dto';
import { UpdateDeliveryPersonDto } from './dto/update-delivery-person.dto';
import { DeliveryPersonsService } from './delivery-persons.service';

@Controller('delivery-persons')
@Roles(AppRole.ADMIN)
export class DeliveryPersonsController {
  constructor(private readonly deliveryPersonsService: DeliveryPersonsService) {}

  @Get()
  list(@Query() query: ListDeliveryPersonsQueryDto) {
    return this.deliveryPersonsService.list(query);
  }

  @Post()
  create(@Body() body: CreateDeliveryPersonDto) {
    return this.deliveryPersonsService.create(body);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() body: UpdateDeliveryPersonDto) {
    return this.deliveryPersonsService.update(id, body);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id') id: string) {
    await this.deliveryPersonsService.remove(id);
  }
}
