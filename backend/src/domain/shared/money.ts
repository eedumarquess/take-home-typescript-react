import { DomainError } from './domain-error';

export class Money {
  private constructor(private readonly amount: number) {}

  static fromNumber(amount: number) {
    if (!Number.isFinite(amount) || amount < 0) {
      throw new DomainError('Valor monetario invalido', 'INVALID_MONEY');
    }

    return new Money(roundToTwoDecimals(amount));
  }

  add(other: Money) {
    return Money.fromNumber(this.amount + other.amount);
  }

  multiply(quantity: number) {
    if (!Number.isInteger(quantity) || quantity < 0) {
      throw new DomainError('Quantidade invalida para calculo monetario', 'INVALID_QUANTITY');
    }

    return Money.fromNumber(this.amount * quantity);
  }

  toNumber() {
    return this.amount;
  }
}

function roundToTwoDecimals(value: number) {
  return Math.round(value * 100) / 100;
}
