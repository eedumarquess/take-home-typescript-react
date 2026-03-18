import { IsEnum } from 'class-validator';
import { OrderStatusValue } from '../../common/enums/order-status.enum';

export class UpdateOrderStatusDto {
  @IsEnum(OrderStatusValue, {
    message: 'O status deve ser pending, preparing, ready, delivering, delivered ou cancelled',
  })
  status!: OrderStatusValue;
}
