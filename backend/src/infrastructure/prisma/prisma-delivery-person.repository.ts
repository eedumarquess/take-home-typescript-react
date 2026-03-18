import { Injectable } from '@nestjs/common';
import { OrderStatus, Prisma } from '@prisma/client';
import { DeliveryPerson } from '../../domain/delivery-persons/delivery-person';
import type {
  IDeliveryPersonRepository,
  ListDeliveryPersonsQuery,
  SaveDeliveryPersonInput,
} from '../../domain/delivery-persons/delivery-person.repository';
import { VehicleTypeValue } from '../../domain/delivery-persons/vehicle-type.enum';
import { Coordinates } from '../../domain/shared/coordinates';
import { PhoneNumber } from '../../domain/shared/phone-number';
import { PrismaService } from '../../prisma/prisma.service';
import {
  type PrismaDeliveryPersonWithCurrentOrder,
  toDecimal,
  toDeliveryPersonDomain,
  vehicleTypeToPrisma,
} from './prisma.mappers';

@Injectable()
export class PrismaDeliveryPersonRepository implements IDeliveryPersonRepository {
  constructor(private readonly prismaService: PrismaService) {}

  async findMany(query: ListDeliveryPersonsQuery) {
    const deliveryPeople = await this.prismaService.deliveryPerson.findMany({
      include: currentOrderInclude,
      orderBy: {
        createdAt: Prisma.SortOrder.desc,
      },
      where: buildAvailabilityWhere(query.available, query.isActive),
    });

    return deliveryPeople.map((item) =>
      toDeliveryPersonDomain(item as PrismaDeliveryPersonWithCurrentOrder),
    );
  }

  async findById(id: string) {
    const deliveryPerson = await this.prismaService.deliveryPerson.findUnique({
      include: currentOrderInclude,
      where: { id },
    });

    return deliveryPerson
      ? toDeliveryPersonDomain(deliveryPerson as PrismaDeliveryPersonWithCurrentOrder)
      : null;
  }

  async create(input: SaveDeliveryPersonInput) {
    const deliveryPerson = await this.prismaService.deliveryPerson.create({
      data: toPersistenceInput(input),
      include: currentOrderInclude,
    });

    return toDeliveryPersonDomain(deliveryPerson as PrismaDeliveryPersonWithCurrentOrder);
  }

  async update(id: string, input: SaveDeliveryPersonInput) {
    const deliveryPerson = await this.prismaService.deliveryPerson.update({
      data: toPersistenceInput(input),
      include: currentOrderInclude,
      where: { id },
    });

    return toDeliveryPersonDomain(deliveryPerson as PrismaDeliveryPersonWithCurrentOrder);
  }

  delete(id: string) {
    return this.prismaService.deliveryPerson
      .delete({
        where: { id },
      })
      .then(() => undefined);
  }

  async findAvailable() {
    const deliveryPeople = await this.prismaService.deliveryPerson.findMany({
      select: {
        currentLatitude: true,
        currentLongitude: true,
        id: true,
        name: true,
      },
      where: {
        isActive: true,
        orders: {
          none: {
            status: OrderStatus.DELIVERING,
          },
        },
      },
    });

    return deliveryPeople.map((item) =>
      DeliveryPerson.rehydrate({
        currentLocation:
          item.currentLatitude === null || item.currentLongitude === null
            ? null
            : new Coordinates(Number(item.currentLatitude), Number(item.currentLongitude)),
        currentOrderId: null,
        id: item.id,
        isActive: true,
        name: item.name,
        phone: new PhoneNumber('(00) 00000-0000'),
        vehicleType: VehicleTypeValue.BICYCLE,
      }),
    );
  }
}

const currentOrderInclude = {
  orders: {
    select: {
      id: true,
    },
    take: 1,
    where: {
      status: OrderStatus.DELIVERING,
    },
  },
};

function buildAvailabilityWhere(
  available?: boolean,
  isActive?: boolean,
): Prisma.DeliveryPersonWhereInput {
  if (available === true) {
    return {
      isActive,
      orders: {
        none: {
          status: OrderStatus.DELIVERING,
        },
      },
    };
  }

  if (available === false) {
    return {
      isActive,
      orders: {
        some: {
          status: OrderStatus.DELIVERING,
        },
      },
    };
  }

  return {
    isActive,
  };
}

function toPersistenceInput(
  input: SaveDeliveryPersonInput,
): Prisma.DeliveryPersonUncheckedCreateInput {
  return {
    currentLatitude:
      input.currentLocation === null ? null : toDecimal(input.currentLocation.latitude),
    currentLongitude:
      input.currentLocation === null ? null : toDecimal(input.currentLocation.longitude),
    isActive: input.isActive,
    name: input.name,
    phone: input.phone,
    vehicleType: vehicleTypeToPrisma[input.vehicleType],
  };
}
