import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
  createProduct,
  deleteProduct,
  getProduct,
  listProducts,
  updateProduct,
} from '../features/products/api';
import { ApiError } from '../services/api';
import { renderWithAuthRouter } from '../test/render-with-auth';
import { ProductsPage } from './products-page';

vi.mock('../features/products/api', () => ({
  createProduct: vi.fn(),
  deleteProduct: vi.fn(),
  getProduct: vi.fn(),
  listProducts: vi.fn(),
  updateProduct: vi.fn(),
}));

const listProductsMock = vi.mocked(listProducts);
const getProductMock = vi.mocked(getProduct);
const createProductMock = vi.mocked(createProduct);
const updateProductMock = vi.mocked(updateProduct);
const deleteProductMock = vi.mocked(deleteProduct);

const baseListResponse = {
  data: [
    {
      category: 'meal' as const,
      createdAt: '2025-01-10T10:00:00.000Z',
      description: 'Hamburguer artesanal com queijo cheddar',
      id: 'product-1',
      imageUrl: 'https://example.com/burger.jpg',
      isAvailable: true,
      name: 'X-Burger',
      preparationTime: 20,
      price: 32.9,
      updatedAt: '2025-01-10T11:00:00.000Z',
    },
    {
      category: 'drink' as const,
      createdAt: '2025-01-11T10:00:00.000Z',
      description: 'Suco natural do dia',
      id: 'product-2',
      imageUrl: null,
      isAvailable: false,
      name: 'Suco',
      preparationTime: 5,
      price: 12.5,
      updatedAt: '2025-01-11T11:00:00.000Z',
    },
  ],
  pagination: {
    limit: 20,
    page: 1,
    total: 2,
    totalPages: 1,
  },
};

describe('ProductsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    listProductsMock.mockResolvedValue(baseListResponse);
    getProductMock.mockResolvedValue(baseListResponse.data[0]);
    createProductMock.mockResolvedValue(baseListResponse.data[0]);
    updateProductMock.mockResolvedValue(baseListResponse.data[0]);
    deleteProductMock.mockResolvedValue(undefined);
  });

  it('renders the catalog table for viewers and keeps unavailable products visible', async () => {
    renderProductsPage({
      role: 'viewer',
    });

    expect(await screen.findByText('X-Burger')).toBeInTheDocument();
    expect(screen.getByText('Suco')).toBeInTheDocument();
    expect(screen.getByText('Modo somente leitura.')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Novo produto' })).not.toBeInTheDocument();
  });

  it('applies filters when the user changes search and availability', async () => {
    const user = userEvent.setup();

    renderProductsPage({
      role: 'viewer',
    });

    await screen.findByText('X-Burger');

    await user.type(screen.getByLabelText('Buscar por nome'), 'suco');
    await user.selectOptions(screen.getByLabelText('Disponibilidade'), 'unavailable');

    await waitFor(() => {
      expect(listProductsMock).toHaveBeenCalled();
      expect(listProductsMock.mock.calls.at(-1)?.[0]).toMatchObject({
        isAvailable: false,
        page: 1,
        search: 'suco',
        sortBy: 'createdAt',
        sortOrder: 'desc',
      });
    });
  });

  it('submits the admin form and creates a product', async () => {
    const user = userEvent.setup();

    createProductMock.mockResolvedValue({
      ...baseListResponse.data[0],
      category: 'dessert',
      id: 'product-99',
      name: 'Brownie',
      price: 18.5,
    });

    renderProductsPage({
      role: 'admin',
    });

    await screen.findByText('X-Burger');

    await user.click(screen.getByRole('button', { name: 'Novo produto' }));
    await user.clear(screen.getByLabelText('Nome'));
    await user.type(screen.getByLabelText('Nome'), 'Brownie');
    await user.clear(screen.getByLabelText('Descricao'));
    await user.type(screen.getByLabelText('Descricao'), 'Brownie de chocolate com sorvete');
    await user.clear(screen.getByLabelText('Preco'));
    await user.type(screen.getByLabelText('Preco'), '18.50');
    await user.clear(screen.getByLabelText('Preparo (min)'));
    await user.type(screen.getByLabelText('Preparo (min)'), '8');
    await user.selectOptions(screen.getAllByLabelText('Categoria')[1], 'dessert');
    await user.click(screen.getByRole('button', { name: 'Criar produto' }));

    await waitFor(() => {
      expect(createProductMock).toHaveBeenCalledWith({
        category: 'dessert',
        description: 'Brownie de chocolate com sorvete',
        imageUrl: undefined,
        isAvailable: true,
        name: 'Brownie',
        preparationTime: 8,
        price: 18.5,
      });
    });
    expect(await screen.findByText('Produto criado com sucesso.')).toBeInTheDocument();
  });

  it('shows a clear error when delete is blocked by active orders', async () => {
    const user = userEvent.setup();

    deleteProductMock.mockRejectedValue(
      new ApiError(
        'Nao e possivel deletar este produto pois ele esta vinculado a pedidos com status pending ou preparing',
        409,
        'PRODUCT_IN_USE',
        [],
      ),
    );

    renderProductsPage({
      role: 'admin',
    });

    await screen.findByText('X-Burger');
    await user.click(screen.getAllByRole('button', { name: 'Editar' })[0]);
    await waitFor(() => expect(getProductMock).toHaveBeenCalledWith('product-1'));
    await user.click(screen.getByRole('button', { name: 'Excluir produto' }));
    await user.click(screen.getByRole('button', { name: 'Confirmar exclusao' }));

    expect(
      await screen.findByText(
        'Este produto esta vinculado a pedidos pending ou preparing e nao pode ser excluido.',
      ),
    ).toBeInTheDocument();
  });
});

function renderProductsPage(options: { role: 'admin' | 'viewer' }) {
  return renderWithAuthRouter(
    [
      {
        path: '/products',
        element: <ProductsPage />,
      },
    ],
    {
      auth: {
        isAuthenticated: true,
        status: 'authenticated',
        user: {
          email: `${options.role}@fastmeals.com`,
          id: `user-${options.role}`,
          role: options.role,
        },
      },
      initialEntries: ['/products'],
    },
  );
}
