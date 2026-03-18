import { Injectable } from '@nestjs/common';
import { AppException } from '../../common/errors/app.exception';
import { AppErrorCode } from '../../common/errors/app-error-code.enum';
import { DeliveryPerson } from '../../domain/delivery-persons/delivery-person';
import type {
  IDeliveryPersonRepository,
  ListDeliveryPersonsQuery,
} from '../../domain/delivery-persons/delivery-person.repository';
import type { VehicleTypeValue } from '../../domain/delivery-persons/vehicle-type.enum';
import { Coordinates } from '../../domain/shared/coordinates';
import { DomainError } from '../../domain/shared/domain-error';
import { PhoneNumber } from '../../domain/shared/phone-number';
import { toDeliveryPersonResponse } from '../presenters/delivery-person.presenter';

type SaveDeliveryPersonCommand = {
  name: string;
  phone: string;
  vehicleType: VehicleTypeValue;
  isActive: boolean;
  currentLatitude?: number;
  currentLongitude?: number;
};

@Injectable()
export class ListDeliveryPersonsUseCase {
  constructor(private readonly deliveryPersonsRepository: IDeliveryPersonRepository) {}

  async execute(query: ListDeliveryPersonsQuery) {
    const items = await this.deliveryPersonsRepository.findMany(query);

    return {
      data: items.map(toDeliveryPersonResponse),
    };
  }
}

@Injectable()
export class GetDeliveryPersonUseCase {
  constructor(private readonly deliveryPersonsRepository: IDeliveryPersonRepository) {}

  async execute(id: string) {
    const deliveryPerson = await this.deliveryPersonsRepository.findById(id);

    if (!deliveryPerson) {
      throw deliveryPersonNotFound();
    }

    return toDeliveryPersonResponse(deliveryPerson);
  }
}

@Injectable()
export class CreateDeliveryPersonUseCase {
  constructor(private readonly deliveryPersonsRepository: IDeliveryPersonRepository) {}

  async execute(input: SaveDeliveryPersonCommand) {
    assertCoordinatePair(input.currentLatitude, input.currentLongitude);

    DeliveryPerson.create(toDeliveryPersonDraft(input));
    const deliveryPerson = await this.deliveryPersonsRepository.create({
      currentLocation: toCoordinates(input.currentLatitude, input.currentLongitude),
      isActive: input.isActive,
      name: input.name,
      phone: input.phone,
      vehicleType: input.vehicleType,
    });

    return toDeliveryPersonResponse(deliveryPerson);
  }
}

@Injectable()
export class UpdateDeliveryPersonUseCase {
  constructor(private readonly deliveryPersonsRepository: IDeliveryPersonRepository) {}

  async execute(id: string, input: SaveDeliveryPersonCommand) {
    assertCoordinatePair(input.currentLatitude, input.currentLongitude);

    const currentDeliveryPerson = await this.deliveryPersonsRepository.findById(id);

    if (!currentDeliveryPerson) {
      throw deliveryPersonNotFound();
    }

    currentDeliveryPerson.update(toDeliveryPersonDraft(input));
    const updatedDeliveryPerson = await this.deliveryPersonsRepository.update(id, {
      currentLocation: toCoordinates(input.currentLatitude, input.currentLongitude),
      isActive: input.isActive,
      name: input.name,
      phone: input.phone,
      vehicleType: input.vehicleType,
    });

    return toDeliveryPersonResponse(updatedDeliveryPerson);
  }
}

@Injectable()
export class DeleteDeliveryPersonUseCase {
  constructor(private readonly deliveryPersonsRepository: IDeliveryPersonRepository) {}

  async execute(id: string) {
    const deliveryPerson = await this.deliveryPersonsRepository.findById(id);

    if (!deliveryPerson) {
      throw deliveryPersonNotFound();
    }

    try {
      deliveryPerson.assertCanBeDeleted();
    } catch (error) {
      if (error instanceof DomainError) {
        throw new AppException(409, AppErrorCode.DELIVERY_PERSON_IN_USE, error.message, []);
      }

      throw error;
    }

    await this.deliveryPersonsRepository.delete(id);
  }
}

function toCoordinates(latitude?: number, longitude?: number) {
  if (latitude === undefined || longitude === undefined) {
    return null;
  }

  return new Coordinates(latitude, longitude);
}

function toDeliveryPersonDraft(input: SaveDeliveryPersonCommand) {
  return {
    currentLocation: toCoordinates(input.currentLatitude, input.currentLongitude),
    isActive: input.isActive,
    name: input.name,
    phone: new PhoneNumber(input.phone),
    vehicleType: input.vehicleType,
  };
}

function assertCoordinatePair(currentLatitude?: number, currentLongitude?: number) {
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

function deliveryPersonNotFound() {
  return new AppException(
    404,
    AppErrorCode.DELIVERY_PERSON_NOT_FOUND,
    'Entregador nao encontrado',
    [],
  );
}
