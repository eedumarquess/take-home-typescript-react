import { OrderStatus, Prisma } from '@prisma/client';
import request from 'supertest';
import { AppRole } from '../src/common/enums/app-role.enum';
import { createTestApp } from './support/create-test-app';

describe('Optimization and Reports (e2e)', () => {
  it('returns optimized assignments for ready orders', async () => {
    const { app, issueAccessToken } = await createTestApp({
      prismaOverrides: {
        deliveryPerson: {
          findMany: jest.fn().mockResolvedValue([
            {
              currentLatitude: new Prisma.Decimal('-23.55052'),
              currentLongitude: new Prisma.Decimal('-46.63334'),
              id: 'delivery-1',
              name: 'Carlos Santos',
            },
            {
              currentLatitude: new Prisma.Decimal('-23.56143'),
              currentLongitude: new Prisma.Decimal('-46.65651'),
              id: 'delivery-2',
              name: 'Ana Souza',
            },
          ]),
        },
        order: {
          findMany: jest.fn().mockResolvedValue([
            {
              deliveryAddress: 'Rua Augusta, 10',
              id: 'order-1',
              latitude: new Prisma.Decimal('-23.55055'),
              longitude: new Prisma.Decimal('-46.63331'),
            },
            {
              deliveryAddress: 'Av. Paulista, 1000',
              id: 'order-2',
              latitude: new Prisma.Decimal('-23.56141'),
              longitude: new Prisma.Decimal('-46.65657'),
            },
          ]),
        },
      },
    });
    const adminToken = await issueAccessToken({
      email: 'admin@fastmeals.com',
      role: AppRole.ADMIN,
      sub: 'user-admin',
    });

    await request(app.getHttpServer())
      .post('/api/orders/optimize-assignment')
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200)
      .expect(({ body }) => {
        expect(body.algorithm).toBe('hungarian');
        expect(body.executionTimeMs).toBeGreaterThan(0);
        expect(body.unassigned).toEqual([]);
        expect(body.assignments).toEqual(
          expect.arrayContaining([
            expect.objectContaining({
              deliveryPersonId: 'delivery-1',
              orderId: 'order-1',
            }),
            expect.objectContaining({
              deliveryPersonId: 'delivery-2',
              orderId: 'order-2',
            }),
          ]),
        );
      });

    await app.close();
  });

  it('returns delivered revenue and top products for viewer users', async () => {
    const deliveredOrders = [
      {
        deliveredAt: new Date('2025-01-01T12:00:00.000Z'),
        totalAmount: new Prisma.Decimal('50.00'),
      },
      {
        deliveredAt: new Date('2025-01-02T12:00:00.000Z'),
        totalAmount: new Prisma.Decimal('30.00'),
      },
    ];
    const deliveredItems = [
      {
        product: {
          id: 'product-1',
          name: 'X-Burger',
        },
        quantity: 4,
        unitPrice: new Prisma.Decimal('30.00'),
      },
      {
        product: {
          id: 'product-2',
          name: 'Suco',
        },
        quantity: 2,
        unitPrice: new Prisma.Decimal('8.00'),
      },
    ];
    const { app, issueAccessToken } = await createTestApp({
      prismaOverrides: {
        order: {
          findMany: jest.fn(({ select }: { select?: Record<string, unknown> }) => {
            if (select?.status) {
              return Promise.resolve([{ status: OrderStatus.DELIVERED }]);
            }

            if (select?.deliveryPerson) {
              return Promise.resolve([
                {
                  createdAt: new Date('2025-01-01T10:00:00.000Z'),
                  deliveredAt: new Date('2025-01-01T10:30:00.000Z'),
                  deliveryPerson: {
                    vehicleType: 'MOTORCYCLE',
                  },
                },
              ]);
            }

            return Promise.resolve(deliveredOrders);
          }),
        },
        orderItem: {
          findMany: jest.fn().mockResolvedValue(deliveredItems),
        },
      },
    });
    const viewerToken = await issueAccessToken({
      email: 'viewer@fastmeals.com',
      role: AppRole.VIEWER,
      sub: 'user-viewer',
    });

    await request(app.getHttpServer())
      .get('/api/reports/revenue?startDate=2025-01-01&endDate=2025-01-31')
      .set('Authorization', `Bearer ${viewerToken}`)
      .expect(200)
      .expect({
        averageOrderValue: 40,
        dailyRevenue: [
          { date: '2025-01-01', orders: 1, revenue: 50 },
          { date: '2025-01-02', orders: 1, revenue: 30 },
        ],
        endDate: '2025-01-31',
        startDate: '2025-01-01',
        totalOrders: 2,
        totalRevenue: 80,
      });

    await request(app.getHttpServer())
      .get('/api/reports/top-products?limit=1')
      .set('Authorization', `Bearer ${viewerToken}`)
      .expect(200)
      .expect({
        data: [
          {
            productId: 'product-1',
            productName: 'X-Burger',
            totalQuantity: 4,
            totalRevenue: 120,
          },
        ],
      });

    await app.close();
  });
});
