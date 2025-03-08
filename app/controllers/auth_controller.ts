import { HttpContext } from '@adonisjs/core/http';
import hash from '@adonisjs/core/services/hash';

import { errors } from '@vinejs/vine';
import jwt from 'jsonwebtoken';

import User from '#models/user';
import Session from '#models/session';

import { ErrorReturn } from '#utils/errorReturn';
import { FieldError } from '#utils/fieldErrorPatern';
import { SuccessReturn } from '#utils/successReturn';
import { keyGenerator } from '#utils/auth/authKeyGenerator';
import { encrypt } from '#utils/auth/encryptAndDecrypt';
import { RemoveSession } from '#utils/auth/removeSession';

import { loginValidator } from '#validators/auth';

import env from '#start/env';

import { GatewayFactory } from '#services/Gateways/Factory/gatewayFactory';
import Product from '#models/product';
import Gateway from '#models/gateway';
import { ITransactionPayload } from '#services/Gateways/Base/payment_gateway';
// import Role from '#models/role';
// import { registerValidator } from '#validators/user';

const APP_KEY = env.get('APP_KEY');

export default class AuthController {
  public async login({ response, request }: HttpContext) {
    try {
      const data = await request.validateUsing(loginValidator);

      const existentUser = await User.findBy('email', data.email);

      if (!existentUser) {
        return ErrorReturn({
          msg: 'User not found',
          status: 404,
          res: response,
          fields: [{ field: 'email', message: 'User not found' }],
        });
      }

      const validPassword = await hash.verify(existentUser.password, data.password);

      if (!validPassword) {
        return ErrorReturn({
          msg: 'Invalid password',
          status: 401,
          res: response,
          fields: [{ field: 'password', message: 'Invalid password' }],
        });
      }

      const JwtKey = keyGenerator();
      const encriptJwtKey = encrypt({ data: JwtKey, key: APP_KEY });

      const sessionData = {
        user_id: existentUser.id,
        token_key: encriptJwtKey,
      };

      try {
        const newSession = await Session.create(sessionData);

        const sessionJWT = jwt.sign({ user_id: existentUser.id, session_id: newSession.id }, JwtKey); //sem tempo de expiração

        if (sessionJWT) {
          return SuccessReturn({
            msg: 'login successful',
            status: 200,
            res: response,
            data: { authToken: sessionJWT },
          });
        } else {
          if (newSession) {
            await newSession.delete();
          }
          return ErrorReturn({ status: 500, msg: 'Create user error', res: response });
        }
      } catch (err) {
        return ErrorReturn({
          res: response,
          status: 500,
          msg: 'Create session erro, try later',
        });
      }
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

  public async logout({ response, authPayload }: HttpContext) {
    try {
      if (!authPayload) {
        return ErrorReturn({ res: response, status: 401, msg: 'Not authenticated', actions: { remove_token: true } });
      }

      const success = await RemoveSession({ session_id: authPayload.session_id });
      if (success) {
        return SuccessReturn({ res: response, status: 200, msg: 'Success logout' });
      } else {
        return ErrorReturn({
          status: 500,
          msg: 'Remove session error',
          res: response,
          actions: { remove_token: true },
        });
      }
    } catch (err) {
      return ErrorReturn({ res: response, msg: 'Internal server error', status: 500 });
    }
  }

  public async teste({ response, request, authPayload }: HttpContext) {
    try {
      if (!authPayload) {
        return ErrorReturn({
          msg: 'no auth',
          res: response,
          status: 401,
        });
      }
      const existentUser = await User.query().where('id', authPayload.user_id).first();

      if (!existentUser) {
        return ErrorReturn({
          msg: 'not found user',
          res: response,
          status: 404,
        });
      }
      const data = request.body();

      const existentProduct = await Product.query().where('id', data.product_id).whereNull('deleted_in').first();

      if (!existentProduct) {
        return ErrorReturn({
          msg: 'not found product',
          res: response,
          status: 404,
        });
      }

      const transactionPayload: ITransactionPayload = {
        transaction_amount: Math.round(existentProduct.unit_price * 100 * data.quantity),
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
      console.log(gatewayReturn, usedGateway.id, usedGateway.priority);
    } catch (err) {
      return ErrorReturn({
        msg: 'Error err',
        res: response,
        status: 400,
      });
    }
  }

  // public async teste({ response, request, authPayload }: HttpContext) {
  //   const paymentGateway = GatewayFactory.create('gateway1');
  //   if (!paymentGateway) {
  //     return;
  //   }
  //   const gatewayReturn = await paymentGateway.listTransactions(7);
  // }
}
