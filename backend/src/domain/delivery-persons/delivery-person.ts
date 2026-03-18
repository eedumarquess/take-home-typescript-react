import { Coordinates } from '../shared/coordinates';
import { DomainError } from '../shared/domain-error';
import { PhoneNumber } from '../shared/phone-number';
import { VehicleTypeValue } from './vehicle-type.enum';

export type DeliveryPersonProps = {
  id: string;
  name: string;
  phone: PhoneNumber;
  vehicleType: VehicleTypeValue;
  isActive: boolean;
  currentLocation: Coordinates | null;
  currentOrderId: string | null;
};

export type DeliveryPersonDraft = Omit<DeliveryPersonProps, 'currentOrderId' | 'id'>;

export class DeliveryPerson {
  constructor(private readonly props: DeliveryPersonProps) {}

  static create(input: DeliveryPersonDraft) {
    validateDeliveryPerson(input);

    return new DeliveryPerson({
      ...input,
      currentOrderId: null,
      id: '',
    });
  }

  static rehydrate(props: DeliveryPersonProps) {
    validateDeliveryPerson(props);
    return new DeliveryPerson(props);
  }

  update(input: DeliveryPersonDraft) {
    validateDeliveryPerson(input);

    return new DeliveryPerson({
      ...this.props,
      ...input,
    });
  }

  assertCanBeAssigned() {
    if (!this.props.isActive) {
      throw new DomainError(
        'Nao e possivel atribuir um entregador inativo',
        'DELIVERY_PERSON_INACTIVE',
      );
    }

    if (this.props.currentOrderId) {
      throw new DomainError(
        'Este entregador ja esta atribuido a outro pedido em andamento',
        'DELIVERY_PERSON_UNAVAILABLE',
      );
    }
  }

  assertCanBeDeleted() {
    if (this.props.currentOrderId) {
      throw new DomainError(
        'Nao e possivel remover este entregador porque existe um pedido em andamento vinculado a ele',
        'DELIVERY_PERSON_IN_USE',
      );
    }
  }

  toPrimitives() {
    return this.props;
  }
}

function validateDeliveryPerson(input: DeliveryPersonDraft | DeliveryPersonProps) {
  if (input.name.length < 3 || input.name.length > 100) {
    throw new DomainError('Nome do entregador invalido', 'INVALID_DELIVERY_PERSON_NAME');
  }
}
