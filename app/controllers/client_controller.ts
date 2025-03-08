import Client from '#models/client';
import Transaction from '#models/transaction';
import TransactionProduct from '#models/transaction_product';
import { ErrorReturn } from '#utils/errorReturn';
import { FieldError } from '#utils/fieldErrorPatern';
import { ParameterError } from '#utils/parameterErrorPatern';
import { SuccessReturn } from '#utils/successReturn';
import { detailsValidatorParams } from '#validators/client';
import { HttpContext } from '@adonisjs/core/http';
import { errors } from '@vinejs/vine';

export default class AuthController {
  public async index({ response, authPayload }: HttpContext) {
    try {
      if (!authPayload) {
        return ErrorReturn({ res: response, status: 401, msg: 'Not authenticated', actions: { remove_token: true } });
      }

      const existentClients = await Client.query();

      if (existentClients.length < 1) {
        return ErrorReturn({
          msg: 'Not found clients',
          res: response,
          status: 404,
        });
      }

      const returnPayload = existentClients.map((clients) => ({
        id: clients.id,
        email: clients.email,
        name: clients.name,
      }));
      return SuccessReturn({
        msg: 'Succes get clients',
        res: response,
        status: 200,
        data: returnPayload,
      });
    } catch (err) {
      if (err instanceof errors.E_VALIDATION_ERROR) {
        return ErrorReturn({
          res: response,
          status: 400,
          msg: 'Validation Error',
          fields: FieldError(err.messages),
        });
      }

      return ErrorReturn({
        res: response,
        status: 500,
        msg: 'Internal Server error',
      });
    }
  }
  public async details({ response, authPayload, params }: HttpContext) {
    try {
      if (!authPayload) {
        return ErrorReturn({ res: response, status: 401, msg: 'Not authenticated', actions: { remove_token: true } });
      }
      const parameters = await detailsValidatorParams.validate(params);

      const existentClient = await Client.query().where('id', parameters.id).first();

      if (!existentClient) {
        return ErrorReturn({
          msg: 'Client not found',
          res: response,
          status: 404,
        });
      }
      try {
        const existentPurchases = await Transaction.query().where('client_id', parameters.id);
        const transactionsPayload: Array<Record<string, any>> = [];
        for (const transaction of existentPurchases) {
          const products = await TransactionProduct.query().where('transaction_id', transaction.id).preload('product');
          const payloadProducts = products.map((product) => {
            return {
              id: product.product_id,
              unit_price: product.unit_price,
              quantity: product.quantity,
            };
          });
          const transactionPayload = {
            id: transaction.id,
            gateway_id: transaction.gateway_id,
            external_id: transaction.external_id,
            status: transaction.status,
            amount: transaction.amount / 100,
            card_last_numbers: transaction.card_last_numbers,
            products: payloadProducts,
          };
          transactionsPayload.push(transactionPayload);
        }
        const returnPayload = {
          id: existentClient.id,
          email: existentClient.email,
          name: existentClient.name,
          created_at: existentClient.created_at,
          purchases: transactionsPayload,
        };
        return SuccessReturn({
          msg: 'Success get client data',
          res: response,
          status: 200,
          data: returnPayload,
        });
      } catch (err) {
        return ErrorReturn({
          msg: 'Get client data error',
          res: response,
          status: 500,
        });
      }
    } catch (err) {
      if (err instanceof errors.E_VALIDATION_ERROR) {
        return ErrorReturn({
          res: response,
          status: 400,
          msg: 'Validation Error',
          parameters: err.messages[0].field == 'id' ? ParameterError(err.messages) : undefined,
          fields: err.messages[0].field != 'id' ? FieldError(err.messages) : undefined,
        });
      }
      return ErrorReturn({
        res: response,
        status: 500,
        msg: 'Internal Server error',
      });
    }
  }
}
