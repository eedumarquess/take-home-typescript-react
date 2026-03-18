import { Injectable } from '@nestjs/common';
import { AppException } from '../common/errors/app.exception';
import { AppErrorCode } from '../common/errors/app-error-code.enum';
import { toDeliveryPersonResponse } from './delivery-persons.mapper';
import { DeliveryPersonsRepository } from './delivery-persons.repository';
import type { CreateDeliveryPersonDto } from './dto/create-delivery-person.dto';
import type { ListDeliveryPersonsQueryDto } from './dto/list-delivery-persons-query.dto';
import type { UpdateDeliveryPersonDto } from './dto/update-delivery-person.dto';

@Injectable()
export class DeliveryPersonsService {
  constructor(private readonly deliveryPersonsRepository: DeliveryPersonsRepository) {}

  async list(query: ListDeliveryPersonsQueryDto) {
    const items = await this.deliveryPersonsRepository.findMany(query);

    return {
      data: items.map(toDeliveryPersonResponse),
    };
  }

  async create(input: CreateDeliveryPersonDto) {
    this.assertCoordinatePair(input.currentLatitude, input.currentLongitude);

    const deliveryPerson = await this.deliveryPersonsRepository.create({
      currentLatitude: input.currentLatitude,
      currentLongitude: input.currentLongitude,
      isActive: input.isActive,
      name: input.name,
      phone: input.phone,
      vehicleType: input.vehicleType,
    });

    return toDeliveryPersonResponse(deliveryPerson);
  }

  async update(id: string, input: UpdateDeliveryPersonDto) {
    this.assertCoordinatePair(input.currentLatitude, input.currentLongitude);
    await this.ensureExists(id);

    const deliveryPerson = await this.deliveryPersonsRepository.update(id, {
      currentLatitude: input.currentLatitude,
      currentLongitude: input.currentLongitude,
      isActive: input.isActive,
      name: input.name,
      phone: input.phone,
      vehicleType: input.vehicleType,
    });

    return toDeliveryPersonResponse(deliveryPerson);
  }

  async remove(id: string) {
    const deliveryPerson = await this.ensureExists(id);

    if (deliveryPerson.orders.length > 0) {
      throw new AppException(
        409,
        AppErrorCode.DELIVERY_PERSON_IN_USE,
        'Nao e possivel remover este entregador porque existe um pedido em andamento vinculado a ele',
        [],
      );
    }

    await this.deliveryPersonsRepository.delete(id);
  }

  private async ensureExists(id: string) {
    const deliveryPerson = await this.deliveryPersonsRepository.findById(id);

    if (!deliveryPerson) {
      throw new AppException(
        404,
        AppErrorCode.DELIVERY_PERSON_NOT_FOUND,
        'Entregador nao encontrado',
        [],
      );
    }

    return deliveryPerson;
  }

  private assertCoordinatePair(currentLatitude?: number, currentLongitude?: number) {
    const hasLatitude = currentLatitude !== undefined;
    const hasLongitude = currentLongitude !== undefined;

    if (hasLatitude === hasLongitude) {
      return;
    }

    throw new AppException(400, AppErrorCode.VALIDATION_ERROR, 'Dados invalidos', [
      {
        field: hasLatitude ? 'currentLongitude' : 'currentLatitude',
        message: 'Informe latitude e longitude juntas para registrar a posicao atual',
      },
    ]);
  }
}
