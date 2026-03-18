import { Injectable } from '@nestjs/common';
import { OrderStatus, Prisma } from '@prisma/client';
import { VehicleTypeValue } from '../common/enums/vehicle-type.enum';
import { PrismaService } from '../prisma/prisma.service';
import { buildDeliveryPersonAvailabilityWhere } from './delivery-person-availability';
import {
  type DeliveryPersonWithCurrentOrder,
  vehicleTypeToPrisma,
} from './delivery-persons.mapper';
import type { ListDeliveryPersonsQueryDto } from './dto/list-delivery-persons-query.dto';

export type SaveDeliveryPersonInput = {
  name: string;
  phone: string;
  vehicleType: VehicleTypeValue;
  isActive: boolean;
  currentLatitude?: number;
  currentLongitude?: number;
};

@Injectable()
export class DeliveryPersonsRepository {
  constructor(private readonly prismaService: PrismaService) {}

  findMany(query: ListDeliveryPersonsQueryDto): Promise<DeliveryPersonWithCurrentOrder[]> {
    return this.prismaService.deliveryPerson.findMany({
      include: {
        orders: {
          select: {
            id: true,
          },
          take: 1,
          where: {
            status: OrderStatus.DELIVERING,
          },
        },
      },
      orderBy: {
        createdAt: Prisma.SortOrder.desc,
      },
      where: this.buildWhere(query),
    });
  }

  findById(id: string): Promise<DeliveryPersonWithCurrentOrder | null> {
    return this.prismaService.deliveryPerson.findUnique({
      include: {
        orders: {
          select: {
            id: true,
          },
          take: 1,
          where: {
            status: OrderStatus.DELIVERING,
          },
        },
      },
      where: { id },
    });
  }

  create(input: SaveDeliveryPersonInput): Promise<DeliveryPersonWithCurrentOrder> {
    return this.prismaService.deliveryPerson.create({
      data: this.toPersistenceInput(input),
      include: {
        orders: {
          select: {
            id: true,
          },
          take: 1,
          where: {
            status: OrderStatus.DELIVERING,
          },
        },
      },
    });
  }

  update(id: string, input: SaveDeliveryPersonInput): Promise<DeliveryPersonWithCurrentOrder> {
    return this.prismaService.deliveryPerson.update({
      data: this.toPersistenceInput(input),
      include: {
        orders: {
          select: {
            id: true,
          },
          take: 1,
          where: {
            status: OrderStatus.DELIVERING,
          },
        },
      },
      where: { id },
    });
  }

  delete(id: string) {
    return this.prismaService.deliveryPerson.delete({
      where: { id },
    });
  }

  private buildWhere(query: ListDeliveryPersonsQueryDto): Prisma.DeliveryPersonWhereInput {
    return buildDeliveryPersonAvailabilityWhere(query.available, query.isActive);
  }

  private toPersistenceInput(
    input: SaveDeliveryPersonInput,
  ): Prisma.DeliveryPersonUncheckedCreateInput {
    return {
      currentLatitude:
        input.currentLatitude === undefined ? null : new Prisma.Decimal(input.currentLatitude),
      currentLongitude:
        input.currentLongitude === undefined ? null : new Prisma.Decimal(input.currentLongitude),
      isActive: input.isActive,
      name: input.name,
      phone: input.phone,
      vehicleType: vehicleTypeToPrisma[input.vehicleType],
    };
  }
}
