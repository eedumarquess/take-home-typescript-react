import { DomainError } from '../shared/domain-error';
import { Money } from '../shared/money';
import { ProductCategoryValue } from './product-category.enum';

export type ProductProps = {
  id: string;
  name: string;
  description: string;
  price: Money;
  category: ProductCategoryValue;
  imageUrl: string | null;
  isAvailable: boolean;
  preparationTime: number;
  createdAt: Date;
  updatedAt: Date;
};

export type ProductDraft = Omit<ProductProps, 'createdAt' | 'id' | 'updatedAt'>;

export class Product {
  constructor(private readonly props: ProductProps) {}

  static create(input: ProductDraft) {
    validateProductFields(input);

    return new Product({
      ...input,
      createdAt: new Date(),
      id: '',
      updatedAt: new Date(),
    });
  }

  static rehydrate(props: ProductProps) {
    validateProductFields(props);
    return new Product(props);
  }

  update(input: ProductDraft) {
    validateProductFields(input);

    return new Product({
      ...this.props,
      ...input,
      updatedAt: new Date(),
    });
  }

  deactivate() {
    return new Product({
      ...this.props,
      isAvailable: false,
      updatedAt: new Date(),
    });
  }

  toPrimitives() {
    return this.props;
  }
}

function validateProductFields(input: ProductDraft | ProductProps) {
  if (input.name.length < 3 || input.name.length > 120) {
    throw new DomainError('Nome do produto invalido', 'INVALID_PRODUCT_NAME');
  }

  if (input.description.length < 10 || input.description.length > 500) {
    throw new DomainError('Descricao do produto invalida', 'INVALID_PRODUCT_DESCRIPTION');
  }

  if (input.preparationTime < 1 || input.preparationTime > 120) {
    throw new DomainError('Tempo de preparo invalido', 'INVALID_PREPARATION_TIME');
  }
}
