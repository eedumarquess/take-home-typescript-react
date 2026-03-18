import { OrderStatus, Prisma, UserRole } from '@prisma/client';
import request from 'supertest';
import { AppRole } from '../src/common/enums/app-role.enum';
import { createTestApp } from './support/create-test-app';

describe('Orders (e2e)', () => {
  it('allows viewers to list orders and returns paginated data', async () => {
    const { app, issueAccessToken } = await createTestApp({
      prismaOverrides: createOrdersPrismaOverrides(),
    });
    const viewerToken = await issueAccessToken({
      email: 'viewer@fastmeals.com',
      role: AppRole.VIEWER,
      sub: 'user-viewer',
    });

    await request(app.getHttpServer())
      .get('/api/orders')
      .set('Authorization', `Bearer ${viewerToken}`)
      .expect(200)
      .expect(({ body }) => {
        expect(body.pagination).toMatchObject({
          limit: 20,
          page: 1,
          total: 1,
          totalPages: 1,
        });
        expect(body.data).toEqual(
          expect.arrayContaining([
            expect.objectContaining({
              customerName: 'Joao Silva',
              deliveryPerson: null,
              status: 'ready',
            }),
          ]),
        );
      });

    await app.close();
  });

  it('returns 403 when a viewer tries to create an order', async () => {
    const { app, issueAccessToken } = await createTestApp({
      prismaOverrides: createOrdersPrismaOverrides(),
      users: [
        {
          createdAt: new Date(),
          email: 'viewer@fastmeals.com',
          id: 'user-viewer',
          password: 'hashed',
          role: UserRole.VIEWER,
          updatedAt: new Date(),
        },
      ],
    });
    const viewerToken = await issueAccessToken({
      email: 'viewer@fastmeals.com',
      role: AppRole.VIEWER,
      sub: 'user-viewer',
    });

    await request(app.getHttpServer())
      .post('/api/orders')
      .set('Authorization', `Bearer ${viewerToken}`)
      .send({
        customerName: 'Maria Oliveira',
        customerPhone: '(11) 99876-5432',
        deliveryAddress: 'Rua das Flores, 123, Sao Paulo - SP',
        items: [{ productId: '550e8400-e29b-41d4-a716-446655440001', quantity: 1 }],
        latitude: -23.5505,
        longitude: -46.6333,
      })
      .expect(403)
      .expect({
        error: {
          code: 'FORBIDDEN',
          message: 'Permissao insuficiente para a acao',
          details: [],
        },
      });

    await app.close();
  });

  it('returns 404 ORDER_NOT_FOUND for unknown order detail requests', async () => {
    const { app, issueAccessToken } = await createTestApp({
      prismaOverrides: createOrdersPrismaOverrides(),
    });
    const adminToken = await issueAccessToken({
      email: 'admin@fastmeals.com',
      role: AppRole.ADMIN,
      sub: 'user-admin',
    });

    await request(app.getHttpServer())
      .get('/api/orders/missing-order')
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(404)
      .expect({
        error: {
          code: 'ORDER_NOT_FOUND',
          message: 'Pedido nao encontrado',
          details: [],
        },
      });

    await app.close();
  });

  it('returns 422 when transitioning ready to delivering without deliveryPersonId', async () => {
    const { app, issueAccessToken } = await createTestApp({
      prismaOverrides: createOrdersPrismaOverrides({
        readyOrderWithoutDeliveryPerson: true,
      }),
    });
    const adminToken = await issueAccessToken({
      email: 'admin@fastmeals.com',
      role: AppRole.ADMIN,
      sub: 'user-admin',
    });

    await request(app.getHttpServer())
      .patch('/api/orders/order-ready/status')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        status: 'delivering',
      })
      .expect(422)
      .expect({
        error: {
          code: 'INVALID_STATUS_TRANSITION',
          message:
            "Nao e possivel alterar o status de 'ready' para 'delivering' sem entregador atribuido",
          details: [],
        },
      });

    await app.close();
  });

  it('returns 422 when assigning a delivery person to a non-ready order', async () => {
    const { app, issueAccessToken } = await createTestApp({
      prismaOverrides: createOrdersPrismaOverrides({
        preparingOrder: true,
      }),
    });
    const adminToken = await issueAccessToken({
      email: 'admin@fastmeals.com',
      role: AppRole.ADMIN,
      sub: 'user-admin',
    });

    await request(app.getHttpServer())
      .patch('/api/orders/order-preparing/assign')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        deliveryPersonId: '550e8400-e29b-41d4-a716-446655440050',
      })
      .expect(422)
      .expect({
        error: {
          code: 'ORDER_ASSIGNMENT_NOT_ALLOWED',
          message: "A atribuicao so e permitida para pedidos com status 'ready'",
          details: [],
        },
      });

    await app.close();
  });
});

function createOrdersPrismaOverrides(
  options: { preparingOrder?: boolean; readyOrderWithoutDeliveryPerson?: boolean } = {},
) {
  const readyOrder = buildOrder({
    deliveryPersonId: options.readyOrderWithoutDeliveryPerson ? null : 'delivery-1',
    id: 'order-ready',
    status: OrderStatus.READY,
  });
  const preparingOrder = buildOrder({
    id: 'order-preparing',
    status: OrderStatus.PREPARING,
  });
  const orders = [readyOrder];

  if (options.preparingOrder) {
    orders.push(preparingOrder);
  }

  return {
    deliveryPerson: {
      findUnique: jest.fn().mockResolvedValue(null),
    },
    order: {
      count: jest.fn().mockResolvedValue(orders.length),
      findMany: jest.fn().mockResolvedValue(orders),
      findUnique: jest.fn(({ where }: { where: { id: string } }) =>
        Promise.resolve(orders.find((order) => order.id === where.id) ?? null),
      ),
      update: jest.fn(),
    },
    orderStatusEvent: {
      create: jest.fn(),
    },
    product: {
      findMany: jest.fn().mockResolvedValue([]),
    },
  };
}

function buildOrder(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    createdAt: new Date('2025-01-20T14:30:00.000Z'),
    customerName: 'Joao Silva',
    customerPhone: '(11) 99999-1234',
    deliveredAt: null,
    deliveryAddress: 'Rua das Flores, 123, Sao Paulo - SP',
    deliveryPerson: null,
    deliveryPersonId: null,
    id: 'order-1',
    items: [
      {
        createdAt: new Date('2025-01-20T14:30:00.000Z'),
        id: 'item-1',
        orderId: 'order-1',
        product: {
          id: 'product-1',
          name: 'X-Burger Especial',
        },
        productId: 'product-1',
        quantity: 2,
        unitPrice: new Prisma.Decimal('32.90'),
      },
    ],
    latitude: new Prisma.Decimal('-23.55050000'),
    longitude: new Prisma.Decimal('-46.63330000'),
    status: OrderStatus.READY,
    totalAmount: new Prisma.Decimal('65.80'),
    updatedAt: new Date('2025-01-20T14:30:00.000Z'),
    ...overrides,
  };
}
