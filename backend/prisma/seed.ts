import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import {
  OrderStatus,
  Prisma,
  PrismaClient,
  ProductCategory,
  UserRole,
  VehicleType,
} from '@prisma/client';
import { hash } from 'bcrypt';

type SeedUser = {
  email: string;
  password: string;
  role: 'admin' | 'viewer';
};

type SeedProduct = {
  name: string;
  description: string;
  price: number;
  category: 'meal' | 'drink' | 'dessert' | 'side';
  imageUrl?: string;
  isAvailable: boolean;
  preparationTime: number;
};

type SeedDeliveryPerson = {
  name: string;
  phone: string;
  vehicleType: 'bicycle' | 'motorcycle' | 'car';
  isActive: boolean;
  currentLatitude?: number;
  currentLongitude?: number;
};

type SeedOrder = {
  customerName: string;
  customerPhone: string;
  deliveryAddress: string;
  latitude: number;
  longitude: number;
  status: 'pending' | 'preparing' | 'ready' | 'delivering' | 'delivered' | 'cancelled';
  deliveryPersonIndex?: number;
  createdAt?: string;
  updatedAt?: string;
  deliveredAt?: string;
  statusEvents?: Array<{
    status: 'pending' | 'preparing' | 'ready' | 'delivering' | 'delivered' | 'cancelled';
    occurredAt: string;
  }>;
  items: Array<{
    productIndex: number;
    quantity: number;
  }>;
};

type SeedData = {
  users: SeedUser[];
  products: SeedProduct[];
  deliveryPersons: SeedDeliveryPerson[];
  orders: SeedOrder[];
};

const prisma = new PrismaClient();

const roleMap: Record<SeedUser['role'], UserRole> = {
  admin: UserRole.ADMIN,
  viewer: UserRole.VIEWER,
};

const categoryMap: Record<SeedProduct['category'], ProductCategory> = {
  meal: ProductCategory.MEAL,
  drink: ProductCategory.DRINK,
  dessert: ProductCategory.DESSERT,
  side: ProductCategory.SIDE,
};

const vehicleTypeMap: Record<SeedDeliveryPerson['vehicleType'], VehicleType> = {
  bicycle: VehicleType.BICYCLE,
  motorcycle: VehicleType.MOTORCYCLE,
  car: VehicleType.CAR,
};

const orderStatusMap: Record<SeedOrder['status'], OrderStatus> = {
  pending: OrderStatus.PENDING,
  preparing: OrderStatus.PREPARING,
  ready: OrderStatus.READY,
  delivering: OrderStatus.DELIVERING,
  delivered: OrderStatus.DELIVERED,
  cancelled: OrderStatus.CANCELLED,
};

async function loadSeedData() {
  const dataPath = join(__dirname, '..', '..', 'seed', 'data.json');
  const raw = await readFile(dataPath, 'utf8');

  return JSON.parse(raw) as SeedData;
}

async function resetDatabase() {
  await prisma.orderStatusEvent.deleteMany();
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.deliveryPerson.deleteMany();
  await prisma.product.deleteMany();
  await prisma.user.deleteMany();
}

async function seedUsers(users: SeedUser[]) {
  for (const user of users) {
    await prisma.user.create({
      data: {
        email: user.email,
        password: await hash(user.password, 10),
        role: roleMap[user.role],
      },
    });
  }
}

async function seedProducts(products: SeedProduct[]) {
  const createdProducts = [];

  for (const product of products) {
    const createdProduct = await prisma.product.create({
      data: {
        name: product.name,
        description: product.description,
        price: new Prisma.Decimal(product.price),
        category: categoryMap[product.category],
        imageUrl: product.imageUrl,
        isAvailable: product.isAvailable,
        preparationTime: product.preparationTime,
      },
    });

    createdProducts.push(createdProduct);
  }

  return createdProducts;
}

async function seedDeliveryPersons(deliveryPersons: SeedDeliveryPerson[]) {
  const createdDeliveryPersons = [];

  for (const deliveryPerson of deliveryPersons) {
    const createdDeliveryPerson = await prisma.deliveryPerson.create({
      data: {
        name: deliveryPerson.name,
        phone: deliveryPerson.phone,
        vehicleType: vehicleTypeMap[deliveryPerson.vehicleType],
        isActive: deliveryPerson.isActive,
        currentLatitude:
          deliveryPerson.currentLatitude === undefined
            ? null
            : new Prisma.Decimal(deliveryPerson.currentLatitude),
        currentLongitude:
          deliveryPerson.currentLongitude === undefined
            ? null
            : new Prisma.Decimal(deliveryPerson.currentLongitude),
      },
    });

    createdDeliveryPersons.push(createdDeliveryPerson);
  }

  return createdDeliveryPersons;
}

async function seedOrders(
  orders: SeedOrder[],
  products: SeedProduct[],
  createdProducts: Array<{ id: string }>,
  createdDeliveryPersons: Array<{ id: string }>,
) {
  for (const order of orders) {
    const statusEvents =
      order.statusEvents?.map((event) => ({
        status: orderStatusMap[event.status],
        occurredAt: new Date(event.occurredAt),
      })) ?? [];

    const createdAt =
      order.createdAt === undefined
        ? (statusEvents[0]?.occurredAt ?? new Date())
        : new Date(order.createdAt);
    const deliveredAt =
      order.deliveredAt === undefined ? null : new Date(order.deliveredAt);
    const updatedAt =
      order.updatedAt === undefined
        ? (deliveredAt ?? statusEvents.at(-1)?.occurredAt ?? createdAt)
        : new Date(order.updatedAt);

    const items = order.items.map((item) => {
      const sourceProduct = products[item.productIndex];
      const createdProduct = createdProducts[item.productIndex];

      if (!sourceProduct || !createdProduct) {
        throw new Error(`Invalid product index ${item.productIndex} while seeding orders.`);
      }

      return {
        productId: createdProduct.id,
        quantity: item.quantity,
        unitPrice: new Prisma.Decimal(sourceProduct.price),
        total: sourceProduct.price * item.quantity,
      };
    });

    const totalAmount = items.reduce((accumulator, item) => accumulator + item.total, 0);
    const deliveryPersonId =
      order.deliveryPersonIndex === undefined
        ? null
        : (createdDeliveryPersons[order.deliveryPersonIndex]?.id ?? null);

    await prisma.order.create({
      data: {
        customerName: order.customerName,
        customerPhone: order.customerPhone,
        deliveryAddress: order.deliveryAddress,
        latitude: new Prisma.Decimal(order.latitude),
        longitude: new Prisma.Decimal(order.longitude),
        status: orderStatusMap[order.status],
        totalAmount: new Prisma.Decimal(totalAmount.toFixed(2)),
        deliveryPersonId,
        deliveredAt,
        createdAt,
        updatedAt,
        items: {
          create: items.map(({ total, ...item }) => item),
        },
        statusEvents: {
          create:
            statusEvents.length > 0
              ? statusEvents
              : [
                  {
                    status: orderStatusMap[order.status],
                    occurredAt: createdAt,
                  },
                ],
        },
      },
    });
  }
}

async function main() {
  const data = await loadSeedData();

  await resetDatabase();
  await seedUsers(data.users);
  const createdProducts = await seedProducts(data.products);
  const createdDeliveryPersons = await seedDeliveryPersons(data.deliveryPersons);
  await seedOrders(data.orders, data.products, createdProducts, createdDeliveryPersons);

  console.log(
    `Seed finalizado: ${data.users.length} usuarios, ${data.products.length} produtos, ${data.deliveryPersons.length} entregadores, ${data.orders.length} pedidos.`,
  );
}

main()
  .catch((error) => {
    console.error('Falha ao executar seed do Prisma.', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
