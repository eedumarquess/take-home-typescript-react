import { Prisma, ProductCategory } from '@prisma/client';
import { ProductCategoryValue } from '../common/enums/product-category.enum';
import { SortOrder } from '../common/enums/sort-order.enum';
import { AppErrorCode } from '../common/errors/app-error-code.enum';
import { ProductSortBy } from './dto/list-products-query.dto';
import { ProductsService } from './products.service';

describe('ProductsService', () => {
  const repository = {
    count: jest.fn(),
    countActiveOrderLinks: jest.fn(),
    create: jest.fn(),
    delete: jest.fn(),
    findById: jest.fn(),
    findMany: jest.fn(),
    update: jest.fn(),
  };

  const service = new ProductsService(repository as never);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('lists products with pagination and serializes Decimal and category values', async () => {
    repository.findMany.mockResolvedValue([
      {
        category: ProductCategory.MEAL,
        createdAt: new Date('2025-01-10T10:00:00.000Z'),
        description: 'Hamburguer artesanal com queijo cheddar',
        id: 'product-1',
        imageUrl: 'https://example.com/burger.jpg',
        isAvailable: true,
        name: 'X-Burger',
        preparationTime: 20,
        price: new Prisma.Decimal('32.90'),
        updatedAt: new Date('2025-01-10T11:00:00.000Z'),
      },
    ]);
    repository.count.mockResolvedValue(1);

    const result = await service.list({
      category: ProductCategoryValue.MEAL,
      isAvailable: true,
      limit: 20,
      page: 1,
      search: 'Burger',
      sortBy: ProductSortBy.PRICE,
      sortOrder: SortOrder.ASC,
    });

    expect(repository.findMany).toHaveBeenCalledWith({
      category: ProductCategoryValue.MEAL,
      isAvailable: true,
      limit: 20,
      page: 1,
      search: 'Burger',
      sortBy: ProductSortBy.PRICE,
      sortOrder: SortOrder.ASC,
    });
    expect(result).toEqual({
      data: [
        {
          category: 'meal',
          createdAt: new Date('2025-01-10T10:00:00.000Z'),
          description: 'Hamburguer artesanal com queijo cheddar',
          id: 'product-1',
          imageUrl: 'https://example.com/burger.jpg',
          isAvailable: true,
          name: 'X-Burger',
          preparationTime: 20,
          price: 32.9,
          updatedAt: new Date('2025-01-10T11:00:00.000Z'),
        },
      ],
      pagination: {
        limit: 20,
        page: 1,
        total: 1,
        totalPages: 1,
      },
    });
  });

  it('returns PRODUCT_NOT_FOUND when a product does not exist', async () => {
    repository.findById.mockResolvedValue(null);

    await expect(service.getById('missing-product')).rejects.toMatchObject({
      response: {
        error: {
          code: AppErrorCode.PRODUCT_NOT_FOUND,
          details: [],
          message: 'Produto nao encontrado',
        },
      },
      status: 404,
    });
  });

  it('creates products and preserves admin visibility flags', async () => {
    repository.create.mockResolvedValue({
      category: ProductCategory.DRINK,
      createdAt: new Date('2025-01-10T10:00:00.000Z'),
      description: 'Suco natural de laranja 500ml',
      id: 'product-2',
      imageUrl: null,
      isAvailable: false,
      name: 'Suco',
      preparationTime: 5,
      price: new Prisma.Decimal('12.50'),
      updatedAt: new Date('2025-01-10T10:00:00.000Z'),
    });

    const result = await service.create({
      category: ProductCategoryValue.DRINK,
      description: 'Suco natural de laranja 500ml',
      imageUrl: undefined,
      isAvailable: false,
      name: 'Suco',
      preparationTime: 5,
      price: 12.5,
    });

    expect(repository.create).toHaveBeenCalledWith({
      category: ProductCategoryValue.DRINK,
      description: 'Suco natural de laranja 500ml',
      imageUrl: undefined,
      isAvailable: false,
      name: 'Suco',
      preparationTime: 5,
      price: 12.5,
    });
    expect(result).toMatchObject({
      category: 'drink',
      id: 'product-2',
      isAvailable: false,
      price: 12.5,
    });
  });

  it('blocks deletion when a product is linked to pending or preparing orders', async () => {
    repository.findById.mockResolvedValue({
      category: ProductCategory.MEAL,
      createdAt: new Date(),
      description: 'Produto vinculado',
      id: 'product-3',
      imageUrl: null,
      isAvailable: true,
      name: 'Produto vinculado',
      preparationTime: 10,
      price: new Prisma.Decimal('10.00'),
      updatedAt: new Date(),
    });
    repository.countActiveOrderLinks.mockResolvedValue(2);

    await expect(service.remove('product-3')).rejects.toMatchObject({
      response: {
        error: {
          code: AppErrorCode.PRODUCT_IN_USE,
        },
      },
      status: 409,
    });
    expect(repository.delete).not.toHaveBeenCalled();
  });

  it('deletes products when there is no active order link', async () => {
    repository.findById.mockResolvedValue({
      category: ProductCategory.SIDE,
      createdAt: new Date(),
      description: 'Livre',
      id: 'product-4',
      imageUrl: null,
      isAvailable: true,
      name: 'Livre',
      preparationTime: 6,
      price: new Prisma.Decimal('8.00'),
      updatedAt: new Date(),
    });
    repository.countActiveOrderLinks.mockResolvedValue(0);
    repository.delete.mockResolvedValue(undefined);

    await expect(service.remove('product-4')).resolves.toBeUndefined();
    expect(repository.delete).toHaveBeenCalledWith('product-4');
  });
});
