import { Prisma, VehicleType } from '@prisma/client';
import { VehicleTypeValue } from '../common/enums/vehicle-type.enum';
import { AppErrorCode } from '../common/errors/app-error-code.enum';
import { DeliveryPersonsService } from './delivery-persons.service';

describe('DeliveryPersonsService', () => {
  const repository = {
    create: jest.fn(),
    delete: jest.fn(),
    findById: jest.fn(),
    findMany: jest.fn(),
    update: jest.fn(),
  };

  const service = new DeliveryPersonsService(repository as never);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('lists delivery persons with currentOrderId and numeric coordinates', async () => {
    repository.findMany.mockResolvedValue([
      {
        createdAt: new Date('2025-01-10T10:00:00.000Z'),
        currentLatitude: new Prisma.Decimal('-23.54890000'),
        currentLongitude: new Prisma.Decimal('-46.63880000'),
        id: 'delivery-1',
        isActive: true,
        name: 'Carlos Santos',
        orders: [{ id: 'order-1' }],
        phone: '(11) 91234-5678',
        vehicleType: VehicleType.MOTORCYCLE,
      },
    ]);

    const result = await service.list({
      available: false,
      isActive: true,
    });

    expect(repository.findMany).toHaveBeenCalledWith({
      available: false,
      isActive: true,
    });
    expect(result).toEqual({
      data: [
        {
          currentLatitude: -23.5489,
          currentLongitude: -46.6388,
          currentOrderId: 'order-1',
          id: 'delivery-1',
          isActive: true,
          name: 'Carlos Santos',
          phone: '(11) 91234-5678',
          vehicleType: 'motorcycle',
        },
      ],
    });
  });

  it('creates delivery persons with nullable current order state', async () => {
    repository.create.mockResolvedValue({
      createdAt: new Date('2025-01-10T10:00:00.000Z'),
      currentLatitude: null,
      currentLongitude: null,
      id: 'delivery-2',
      isActive: false,
      name: 'Pedro Oliveira',
      orders: [],
      phone: '(11) 95678-9012',
      vehicleType: VehicleType.CAR,
    });

    const result = await service.create({
      currentLatitude: undefined,
      currentLongitude: undefined,
      isActive: false,
      name: 'Pedro Oliveira',
      phone: '(11) 95678-9012',
      vehicleType: VehicleTypeValue.CAR,
    });

    expect(result).toMatchObject({
      currentOrderId: null,
      id: 'delivery-2',
      isActive: false,
      vehicleType: 'car',
    });
  });

  it('returns DELIVERY_PERSON_NOT_FOUND when updating an unknown delivery person', async () => {
    repository.findById.mockResolvedValue(null);

    await expect(
      service.update('missing-delivery', {
        currentLatitude: -23.55,
        currentLongitude: -46.63,
        isActive: true,
        name: 'Ana',
        phone: '(11) 92345-6789',
        vehicleType: VehicleTypeValue.BICYCLE,
      }),
    ).rejects.toMatchObject({
      response: {
        error: {
          code: AppErrorCode.DELIVERY_PERSON_NOT_FOUND,
        },
      },
      status: 404,
    });
  });

  it('blocks deletion when the delivery person is handling a delivering order', async () => {
    repository.findById.mockResolvedValue({
      createdAt: new Date('2025-01-10T10:00:00.000Z'),
      currentLatitude: new Prisma.Decimal('-23.54890000'),
      currentLongitude: new Prisma.Decimal('-46.63880000'),
      id: 'delivery-3',
      isActive: true,
      name: 'Carlos Santos',
      orders: [{ id: 'order-9' }],
      phone: '(11) 91234-5678',
      vehicleType: VehicleType.MOTORCYCLE,
    });

    await expect(service.remove('delivery-3')).rejects.toMatchObject({
      response: {
        error: {
          code: AppErrorCode.DELIVERY_PERSON_IN_USE,
        },
      },
      status: 409,
    });
    expect(repository.delete).not.toHaveBeenCalled();
  });

  it('deletes idle delivery persons', async () => {
    repository.findById.mockResolvedValue({
      createdAt: new Date('2025-01-10T10:00:00.000Z'),
      currentLatitude: null,
      currentLongitude: null,
      id: 'delivery-4',
      isActive: true,
      name: 'Mariana Souza',
      orders: [],
      phone: '(11) 96789-0123',
      vehicleType: VehicleType.BICYCLE,
    });
    repository.delete.mockResolvedValue(undefined);

    await expect(service.remove('delivery-4')).resolves.toBeUndefined();
    expect(repository.delete).toHaveBeenCalledWith('delivery-4');
  });
});
