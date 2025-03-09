import { PaymentGateway } from '../Base/payment_gateway.js';

interface GatewayMethodConfig {
  endPoint: string;
  metod: 'GET' | 'POST' | 'PUT' | 'DELETE';
  expectedError: Record<string, string> & { message: string };
  expectedData?: Record<string, string> & { external_id: string };
  bodyDataMap?: Record<string, string>;
  dataRoute?: string;
  expectedDataMap?: Array<Record<string, string>>;
  params?: Array<{ external_id: string; type: 'ROUTE' | 'BODY' }>;
  bodyParams?: Array<Record<string, string>>;
}

export interface GatewayConfig {
  methods: {
    login?: GatewayMethodConfig;
    transaction: GatewayMethodConfig; // external_id -> item
    listTransactions: GatewayMethodConfig;
    reimbursement: GatewayMethodConfig;
  };
}

const gateway1: GatewayConfig = {
  methods: {
    login: {
      endPoint: '/login',
      metod: 'POST',
      expectedError: {
        message: 'error',
      },
    },
    transaction: {
      endPoint: '/transactions',
      metod: 'POST',
      dataRoute: 'data',
      expectedData: { external_id: 'id' },
      bodyDataMap: {
        transaction_amount: 'amount',
        client_name: 'name',
        client_email: 'email',
        card_number: 'cardNumber',
        card_CVV: 'cvv',
      },
      expectedError: {
        message: 'error',
      },
    },
    listTransactions: {
      endPoint: '/transactions',
      metod: 'GET',
      dataRoute: 'data',
      expectedDataMap: [
        {
          external_id: 'id',
          client_name: 'name',
          client_email: 'email',
          trasaction_status: 'status',
          transaction_amount: 'amount',
        },
      ],
      expectedError: {
        message: 'error',
      },
    },
    reimbursement: {
      endPoint: '/transactions/:id/charge_back',
      metod: 'POST',
      dataRoute: 'data',
      params: [{ external_id: 'id', type: 'ROUTE' }],
      expectedDataMap: [
        {
          external_id: 'id',
          client_name: 'name',
          client_email: 'email',
          trasaction_status: 'status',
          card_last_digits: 'card_last_digits',
          transaction_amount: 'amount',
        },
      ],
      expectedError: {
        message: 'error',
      },
    },
  },
};

const gateway2: GatewayConfig = {
  methods: {
    transaction: {
      endPoint: '/transacoes',
      metod: 'POST',
      dataRoute: 'data',
      expectedData: { external_id: 'id' },
      bodyDataMap: {
        transaction_amount: 'valor',
        client_name: 'nome',
        client_email: 'email',
        card_number: 'numeroCartao',
        card_CVV: 'cvv',
      },
      expectedError: {
        message: 'error',
      },
    },
    listTransactions: {
      endPoint: '/transacoes',
      metod: 'GET',
      dataRoute: 'data',
      expectedDataMap: [
        {
          external_id: 'id',
          client_name: 'name',
          client_email: 'email',
          trasaction_status: 'status',
          card_last_digits: 'card_last_digits',
          transaction_amount: 'amount',
        },
      ],
      expectedError: {
        message: 'error',
      },
    },
    reimbursement: {
      endPoint: '/transacoes/reembolso',
      metod: 'POST',
      dataRoute: 'data',
      params: [{ external_id: 'id', type: 'BODY' }],
      expectedDataMap: [
        {
          external_id: 'id',
          client_name: 'name',
          client_email: 'email',
          trasaction_status: 'status',
          card_last_digits: 'card_last_digits',
          transaction_amount: 'amount',
        },
      ],
      expectedError: {
        message: 'error',
      },
    },
  },
};

export class GatewayFactory {
  static create(gatewayName: string) {
    switch (gatewayName) {
      case 'gateway1':
        return new PaymentGateway({ gatewayConfig: gateway1 });
      case 'gateway2':
        return new PaymentGateway({ gatewayConfig: gateway2 });

      default:
        return false;
    }
  }
}
