export type ProductCategory = 'meal' | 'drink' | 'dessert' | 'side';

export type Product = {
  id: string;
  name: string;
  description: string;
  price: number;
  category: ProductCategory;
  imageUrl: string | null;
  isAvailable: boolean;
  preparationTime: number;
  createdAt: string;
  updatedAt: string;
};

export type ProductListResponse = {
  data: Product[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
};

export type ProductListQuery = {
  page?: number;
  limit?: number;
  search?: string;
  category?: ProductCategory;
  isAvailable?: boolean;
  sortBy?: 'name' | 'price' | 'createdAt';
  sortOrder?: 'asc' | 'desc';
};

export type SaveProductInput = {
  name: string;
  description: string;
  price: number;
  category: ProductCategory;
  imageUrl?: string;
  isAvailable?: boolean;
  preparationTime: number;
};
