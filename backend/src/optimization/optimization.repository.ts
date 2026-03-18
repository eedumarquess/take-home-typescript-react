import { Injectable } from '@nestjs/common';
import { OrderStatus, Prisma } from '@prisma/client';
import { buildDeliveryPersonAvailabilityWhere } from '../delivery-persons/delivery-person-availability';
import { PrismaService } from '../prisma/prisma.service';

export type OptimizationOrderCandidate = {
  id: string;
  deliveryAddress: string;
  latitude: Prisma.Decimal;
  longitude: Prisma.Decimal;
};

export type OptimizationDeliveryPersonCandidate = {
  id: string;
  name: string;
  currentLatitude: Prisma.Decimal | null;
  currentLongitude: Prisma.Decimal | null;
};

@Injectable()
export class OptimizationRepository {
  constructor(private readonly prismaService: PrismaService) {}

  findReadyOrders(): Promise<OptimizationOrderCandidate[]> {
    return this.prismaService.order.findMany({
      orderBy: {
        createdAt: Prisma.SortOrder.asc,
      },
      select: {
        deliveryAddress: true,
        id: true,
        latitude: true,
        longitude: true,
      },
      where: {
        status: OrderStatus.READY,
      },
    });
  }

  findAvailableDeliveryPersons(): Promise<OptimizationDeliveryPersonCandidate[]> {
    return this.prismaService.deliveryPerson.findMany({
      orderBy: {
        createdAt: Prisma.SortOrder.asc,
      },
      select: {
        currentLatitude: true,
        currentLongitude: true,
        id: true,
        name: true,
      },
      where: {
        ...buildDeliveryPersonAvailabilityWhere(true, true),
      },
    });
  }
}
