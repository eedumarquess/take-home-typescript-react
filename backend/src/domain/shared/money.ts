import { DomainError } from './domain-error';

export class Money {
  private constructor(private readonly cents: number) {}

  static fromNumber(amount: number) {
    if (!Number.isFinite(amount) || amount < 0) {
      throw new DomainError('Valor monetario invalido', 'INVALID_MONEY');
    }

    const cents = Math.round(amount * 100);

    if (Math.abs(amount * 100 - cents) > Number.EPSILON) {
      throw new DomainError('Valor monetario invalido', 'INVALID_MONEY');
    }

    return new Money(cents);
  }

  static fromCents(cents: number) {
    if (!Number.isInteger(cents) || cents < 0) {
      throw new DomainError('Valor monetario invalido', 'INVALID_MONEY');
    }

    return new Money(cents);
  }

  add(other: Money) {
    return Money.fromCents(this.cents + other.cents);
  }

  multiply(quantity: number) {
    if (!Number.isInteger(quantity) || quantity < 0) {
      throw new DomainError('Quantidade invalida para calculo monetario', 'INVALID_QUANTITY');
    }

    return Money.fromCents(this.cents * quantity);
  }

  toNumber() {
    return this.cents / 100;
  }

  toCents() {
    return this.cents;
  }
}
