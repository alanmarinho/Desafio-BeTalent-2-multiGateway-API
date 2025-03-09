// import type { HttpContext } from '@adonisjs/core/http'

import Client from '#models/client';
import Gateway from '#models/gateway';
import Product from '#models/product';
import { RoleTypes } from '#models/role';
import Transaction, { StatusTypes } from '#models/transaction';
import TransactionProduct from '#models/transaction_product';
import User from '#models/user';
import { ITransactionPayload } from '#services/Gateways/Base/payment_gateway';
import { GatewayFactory } from '#services/Gateways/Factory/gatewayFactory';
import { ErrorReturn } from '#utils/errorReturn';
import { FieldError } from '#utils/fieldErrorPatern';
import { ParameterError } from '#utils/parameterErrorPatern';
import { SuccessReturn } from '#utils/successReturn';
import { newPurchaseValidator, reimbursementValidatorParams } from '#validators/purchase';
import { HttpContext } from '@adonisjs/core/http';
import { errors } from '@vinejs/vine';

export default class PurchaseController {
  public async index({ response,  authPayload }: HttpContext) {
    try {
      if (!authPayload) {
        return ErrorReturn({ res: response, status: 401, msg: 'Not authenticated', actions: { remove_token: true } });
      }
      const existentUser = await User.query().where('id', authPayload.user_id).preload('role').first();
      if (!existentUser) {
        return ErrorReturn({
          msg: 'User not found',
          res: response,
          status: 404,
        });
      }
      const userRule = existentUser.role.name;
      const purchaseListQuery = Transaction.query();
      if (userRule !== RoleTypes.ADMIN) {
        const userClient = await Client.query().where('user_id', authPayload.user_id).first();
        if (!userClient) {
          return ErrorReturn({
            msg: 'Cluent not found',
            res: response,
            status: 404,
          });
        }
        purchaseListQuery.where('client_id', userClient.id);
      }
      const purchaseList = await purchaseListQuery;

      const returnPayload = purchaseList.map((purchase) => ({
        id: purchase.id,
        client_id: purchase.client_id,
        ammont: purchase.amount / 100,
        created_at: purchase.created_at,
      }));

      return SuccessReturn({
        msg: 'Succes get purchases',
        res: response,
        status: 200,
        data: returnPayload,
      });
    } catch (err) {
      if (err instanceof errors.E_VALIDATION_ERROR) {
        return ErrorReturn({
          res: response,
          status: 401,
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

  public async newPurchase({ response, request, authPayload }: HttpContext) {
    try {
      if (!authPayload) {
        return ErrorReturn({ res: response, status: 401, msg: 'Not authenticated', actions: { remove_token: true } });
      }
      const data = await request.validateUsing(newPurchaseValidator);

      const existentUser = await User.query().where('id', authPayload.user_id).first();

      if (!existentUser) {
        return ErrorReturn({
          msg: 'not found user',
          res: response,
          status: 404,
        });
      }
      let existentProducts: Array<Product> = [];

      for (const [index, product] of data.products.entries()) {
        const foundProduct = await Product.query().where('id', product.product_id).whereNull('deleted_in').first();
        if (!foundProduct) {
          return ErrorReturn({
            msg: 'Product not found',
            res: response,
            status: 400,
            fields: [{ field: `products[${index}].id`, message: 'Product not found' }],
          });
        }
        existentProducts.push(foundProduct);
      }

      if (!!existentProducts && existentProducts.length < 1) {
        return ErrorReturn({
          msg: 'not found products',
          res: response,
          status: 404,
        });
      }
      let productsAmount = 0;
      data.products.forEach((product) => {
        const existentProduct = existentProducts.find((p) => p?.id === product.product_id);
        if (!existentProduct) {
          return ErrorReturn({
            msg: 'Error when processing purchase',
            res: response,
            status: 500,
          });
        }
        productsAmount = productsAmount + existentProduct.unit_price * product.quantity;
      }, 0);

      const transactionPayload: ITransactionPayload = {
        transaction_amount: Math.round(productsAmount * 100),
        client_name: existentUser.name,
        client_email: existentUser.email,
        card_number: data.credit_card.number,
        card_CVV: data.credit_card.cvv,
      };
      const validPaymentGateway = await Gateway.query().where('is_active', true).orderBy('priority', 'asc');
      if (validPaymentGateway.length < 1) {
        return ErrorReturn({
          msg: 'not have displonible gateways',
          res: response,
          status: 404,
        });
      }
      let gatewayReturn: Record<string, any> | false = false;
      let usedGateway: Gateway = validPaymentGateway[0];
      for (const gateway of validPaymentGateway) {
        const paymentGateway = GatewayFactory.create(gateway.name);
        if (!paymentGateway) return;
        gatewayReturn = await paymentGateway.makeTransaction(gateway.id, transactionPayload);
        if (gatewayReturn != false) {
          usedGateway = gateway;
          break;
        }
      }

      if (gatewayReturn === false) {
        return ErrorReturn({
          msg: 'Proccess payment error',
          res: response,
          status: 400,
        });
      }

      try {
        let existentClient = await Client.query()
          .where('user_id', authPayload.user_id)
          .andWhere('email', existentUser.email)
          .first();

        if (!existentClient) {
          const newClientPayload = {
            name: existentUser.name,
            email: existentUser.email,
            user_id: authPayload.user_id,
          };
          existentClient = await Client.create(newClientPayload);
        }

        const newtransactionPayload = {
          client_id: existentClient.id,
          gateway_id: usedGateway.id,
          status: StatusTypes.APPROVED,
          external_id: gatewayReturn.external_id,
          amount: transactionPayload.transaction_amount,
          card_last_numbers: transactionPayload.card_number.slice(-4),
        };
        const newTransaction = await Transaction.create(newtransactionPayload);

        for (const product of data.products) {
          const productTransactionPayload = {
            product_id: product.product_id,
            client_id: existentClient.id,
            transaction_id: newTransaction.id,
            quantity: product.quantity,
            unit_price: existentProducts.find((existentProduct) => existentProduct?.id === product.product_id)
              ?.unit_price,
          };

          await TransactionProduct.create(productTransactionPayload);
        }
        const returnPayload = {
          purchase_id: newTransaction.id,
          ammont: newTransaction.amount / 100,
          status: newTransaction.status,
        };
        return SuccessReturn({
          msg: 'Success create',
          res: response,
          status: 200,
          data: returnPayload,
        });
      } catch (err) {
        const paymentGateway = GatewayFactory.create(usedGateway.name);
        if (paymentGateway) {
          const successEmaergencyReimbursement = await paymentGateway.reimbursement(
            usedGateway.id,
            gatewayReturn.external_id,
          );

          if (successEmaergencyReimbursement) {
            return ErrorReturn({
              msg: 'An error occurred to process the sale, the reimbursement was made',
              res: response,
              status: 500,
              data: { external_id: gatewayReturn.external_id, gateway_id: usedGateway.id },
            });
          }

          return ErrorReturn({
            msg: 'An error occurred to process the sale, if the sale was charged, in touch with the support',
            res: response,
            status: 500,
            data: { external_id: gatewayReturn.external_id, gateway_id: usedGateway.id },
          });
        } else {
          return ErrorReturn({
            msg: 'An error occurred to process the sale, if the sale was charged, in touch with the support',
            res: response,
            status: 500,
            data: { external_id: gatewayReturn.external_id, gateway_id: usedGateway.id },
          });
        }
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

  public async reimbursement({ response, authPayload, params }: HttpContext) {
    try {
      if (!authPayload) {
        return ErrorReturn({
          res: response,
          status: 401,
          msg: 'Not authenticated',
          actions: { remove_token: true },
        });
      }
      const parameters = await reimbursementValidatorParams.validate(params);

      const existentUser = await User.query().where('id', authPayload.user_id).first();

      if (!existentUser) {
        return ErrorReturn({
          msg: 'not found user',
          res: response,
          status: 404,
        });
      }

      const existentTransaction = await Transaction.query().where('id', parameters.id).preload('gateway').first();

      if (!existentTransaction) {
        return ErrorReturn({
          msg: 'Transaction not found',
          res: response,
          status: 404,
        });
      }

      if (existentTransaction.status !== StatusTypes.APPROVED) {
        return ErrorReturn({
          msg: 'Only transactions already paid can be refunded',
          res: response,
          status: 400,
        });
      }

      const gateway = GatewayFactory.create(existentTransaction.gateway.name);
      if (gateway === false) {
        return ErrorReturn({
          msg: 'It was not possible to complete the refund',
          res: response,
          status: 500,
        });
      }

      const refundedTransaction = await gateway.reimbursement(
        existentTransaction.gateway.id,
        existentTransaction.external_id,
      );
      if (refundedTransaction) {
        existentTransaction.merge({ status: StatusTypes.REFUNDED });
        existentTransaction.save();
        existentTransaction.refresh();
        const refundedTransactionPayload = {
          id: existentTransaction.id,
          status: existentTransaction.status,
        };
        return SuccessReturn({
          msg: 'Success refunded transaction',
          res: response,
          status: 200,
          data: refundedTransactionPayload,
        });
      } else {
        return ErrorReturn({
          msg: 'It was not possible to refund at the moment',
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
