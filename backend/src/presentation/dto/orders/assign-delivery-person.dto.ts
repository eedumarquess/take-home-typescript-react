import { IsUUID } from 'class-validator';

export class AssignDeliveryPersonDto {
  @IsUUID('4', { message: 'O entregador informado e invalido' })
  deliveryPersonId!: string;
}
