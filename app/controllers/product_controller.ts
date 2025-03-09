import { errors } from '@vinejs/vine';
import { HttpContext } from '@adonisjs/core/http';

import Product from '#models/product';

import { ErrorReturn } from '#utils/errorReturn';
import { FieldError } from '#utils/fieldErrorPatern';
import { SuccessReturn } from '#utils/successReturn';

import {
  deleteValidatorParameters,
  detailsValidatorParameters,
  registerValidator,
  updateValidator,
} from '#validators/product';
import { ParameterError } from '#utils/parameterErrorPatern';
import { DateTime } from 'luxon';

export default class ProductController {
  public async index({ response, request, authPayload }: HttpContext) {
    try {
      if (!authPayload) {
        return ErrorReturn({ res: response, status: 401, msg: 'Not authenticated', actions: { remove_token: true } });
      }

      const includeDeleted = request.qs().include_deleted === 'true';

      const productsQuery = Product.query();

      if (!includeDeleted) {
        productsQuery.whereNull('deleted_in');
      }

      const products = await productsQuery.exec();

      const returnPayload = products.map((product) => ({
        id: product.id,
        name: product.name,
        unit_price: product.unit_price,
        deleted_in: !!product.deleted_in ? product.deleted_in : undefined,
      }));

      return SuccessReturn({
        msg: 'Success get all products',
        res: response,
        status: 200,
        data: returnPayload,
      });
    } catch (err) {
      return ErrorReturn({
        res: response,
        status: 500,
        msg: 'Internal Server error',
      });
    }
  }

  public async newProduct({ response, request, authPayload }: HttpContext) {
    try {
      if (!authPayload) {
        return ErrorReturn({ res: response, status: 401, msg: 'Not authenticated', actions: { remove_token: true } });
      }
      const data = await request.validateUsing(registerValidator);

      const newProductPayload = {
        name: data.name,
        unit_price: data.unit_price,
        user_id: authPayload?.user_id,
      };
      const newProduct = await Product.create(newProductPayload);

      const newProductReturnPayload = {
        id: newProduct.id,
        name: newProduct.name,
        unit_price: newProduct.unit_price,
      };

      if (!!newProduct) {
        return SuccessReturn({
          status: 201,
          msg: 'Success create product',
          res: response,
          data: newProductReturnPayload,
        });
      } else {
        return ErrorReturn({ status: 500, msg: 'Create product error', res: response });
      }
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

  public async update({ response, request, authPayload, params }: HttpContext) {
    try {
      if (!authPayload) {
        return ErrorReturn({ res: response, status: 401, msg: 'Not authenticated', actions: { remove_token: true } });
      }
      let data = await request.validateUsing(updateValidator.updateValidatorBody);
      const parameters = await updateValidator.updateValidatorParameters.validate(params);

      if (Object.keys(data).length === 0) {
        return ErrorReturn({ status: 400, msg: 'Data not send', res: response });
      }

      const existentProduct = await Product.query().where('id', parameters.id).whereNull('deleted_in').first();

      if (!existentProduct) {
        return ErrorReturn({
          msg: 'Product not found',
          status: 404,
          res: response,
          parameters: [{ message: 'Product not found', parameter: 'id' }],
        });
      }

      try {
        existentProduct.merge({ ...data });
        await existentProduct.save();
        await existentProduct.refresh();

        const returnPayload = {
          name: existentProduct.name,
          unit_price: existentProduct.unit_price,
        };

        return SuccessReturn({
          msg: 'Success update product',
          res: response,
          status: 200,
          data: returnPayload,
        });
      } catch (err) {
        return ErrorReturn({
          msg: 'Update product error',
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

  public async details({ response, authPayload, params }: HttpContext) {
    try {
      if (!authPayload) {
        return ErrorReturn({ res: response, status: 401, msg: 'Not authenticated', actions: { remove_token: true } });
      }
      const parameters = await detailsValidatorParameters.validate(params);

      const existentProduct = await Product.query().where('id', parameters.id).first();

      if (!existentProduct) {
        return ErrorReturn({
          msg: 'Not found product',
          res: response,
          status: 404,
          parameters: [{ message: 'Not found product', parameter: 'id' }],
        });
      }

      const returnPayload = {
        name: existentProduct.name,
        unit_price: existentProduct.unit_price,
        created_at: existentProduct.created_at,
        deleted_in: !!existentProduct.deleted_in ? existentProduct.deleted_in : undefined,
      };

      return SuccessReturn({
        msg: 'Success get product',
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

  public async softDelete({ response, authPayload, params }: HttpContext) {
    try {
      if (!authPayload) {
        return ErrorReturn({ res: response, status: 401, msg: 'Not authenticated', actions: { remove_token: true } });
      }
      const parameters = await deleteValidatorParameters.validate(params);

      const existentProduct = await Product.query().where('id', parameters.id).first();

      if (!existentProduct) {
        return ErrorReturn({
          msg: 'Not found product',
          res: response,
          status: 404,
          parameters: [{ message: 'Not found product', parameter: 'id' }],
        });
      }
      try {
        existentProduct.merge({ deleted_in: DateTime.now() });
        await existentProduct.save();

        return SuccessReturn({
          msg: 'Success delete product',
          status: 204,
          res: response,
        });
      } catch (err) {
        return ErrorReturn({
          msg: 'Delete product error',
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

  public async restore({ response, authPayload, params }: HttpContext) {
    try {
      if (!authPayload) {
        return ErrorReturn({ res: response, status: 401, msg: 'Not authenticated', actions: { remove_token: true } });
      }
      const parameters = await deleteValidatorParameters.validate(params);

      const existentProduct = await Product.query().where('id', parameters.id).first();

      if (!existentProduct) {
        return ErrorReturn({
          msg: 'Not found product',
          res: response,
          status: 404,
          parameters: [{ message: 'Not found product', parameter: 'id' }],
        });
      }
      try {
        existentProduct.merge({ deleted_in: null });
        await existentProduct.save();

        return SuccessReturn({
          msg: 'Success restore product',
          status: 200,
          res: response,
        });
      } catch (err) {
        return ErrorReturn({
          msg: 'Restore product error',
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
