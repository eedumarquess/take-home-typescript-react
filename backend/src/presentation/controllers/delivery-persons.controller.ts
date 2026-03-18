import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
  Put,
  Query,
} from '@nestjs/common';
import {
  CreateDeliveryPersonUseCase,
  DeleteDeliveryPersonUseCase,
  ListDeliveryPersonsUseCase,
  UpdateDeliveryPersonUseCase,
} from '../../application/delivery-persons/delivery-persons.use-cases';
import { Roles } from '../../common/decorators/roles.decorator';
import { AppRole } from '../../common/enums/app-role.enum';
import { CreateDeliveryPersonDto } from '../dto/delivery-persons/create-delivery-person.dto';
import { ListDeliveryPersonsQueryDto } from '../dto/delivery-persons/list-delivery-persons-query.dto';
import { UpdateDeliveryPersonDto } from '../dto/delivery-persons/update-delivery-person.dto';

@Controller('delivery-persons')
@Roles(AppRole.ADMIN)
export class DeliveryPersonsController {
  constructor(
    private readonly listDeliveryPersonsUseCase: ListDeliveryPersonsUseCase,
    private readonly createDeliveryPersonUseCase: CreateDeliveryPersonUseCase,
    private readonly updateDeliveryPersonUseCase: UpdateDeliveryPersonUseCase,
    private readonly deleteDeliveryPersonUseCase: DeleteDeliveryPersonUseCase,
  ) {}

  @Get()
  list(@Query() query: ListDeliveryPersonsQueryDto) {
    return this.listDeliveryPersonsUseCase.execute(query);
  }

  @Post()
  create(@Body() body: CreateDeliveryPersonDto) {
    return this.createDeliveryPersonUseCase.execute(body);
  }

  @Put(':id')
  update(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Body() body: UpdateDeliveryPersonDto,
  ) {
    return this.updateDeliveryPersonUseCase.execute(id, body);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id', new ParseUUIDPipe({ version: '4' })) id: string) {
    await this.deleteDeliveryPersonUseCase.execute(id);
  }
}
