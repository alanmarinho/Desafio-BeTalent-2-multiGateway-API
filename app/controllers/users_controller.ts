import { errors } from '@vinejs/vine';
import { HttpContext } from '@adonisjs/core/http';
import hash from '@adonisjs/core/services/hash';

import Role from '#models/role';
import User from '#models/user';

import {
  deleteValidatorParameters,
  detailsValidatorParameters,
  registerValidator,
  updateValidator,
} from '#validators/user';

import { ErrorReturn } from '#utils/errorReturn';
import { FieldError } from '#utils/fieldErrorPatern';
import { SuccessReturn } from '#utils/successReturn';
import { ParameterError } from '#utils/parameterErrorPatern';

export default class UsersController {
  public async index({ response, authPayload }: HttpContext) {
    try {
      if (!authPayload) {
        return ErrorReturn({ res: response, status: 401, msg: 'Not authenticated', actions: { remove_token: true } });
      }
      const users = await User.query().preload('role');

      const returnPayload = users.map((user) => ({
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role.name,
      }));

      return SuccessReturn({
        msg: 'Success get all users',
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

  public async register({ response, request, authPayload }: HttpContext) {
    try {
      if (!authPayload) {
        return ErrorReturn({ res: response, status: 401, msg: 'Not authenticated', actions: { remove_token: true } });
      }
      const data = await request.validateUsing(registerValidator);

      const existentUser = await User.findBy('email', data.email);
      const existentRole = await Role.findBy('name', data.role);

      if (existentUser) {
        return ErrorReturn({
          res: response,
          status: 409,
          msg: 'Email already registered',
          fields: [{ field: 'email', message: 'Email already registered' }],
        });
      }

      if (!existentRole) {
        return ErrorReturn({
          res: response,
          status: 409,
          msg: 'Invalid role',
          fields: [{ field: 'role', message: 'Invalid role' }],
        });
      }
      const newUserPayload = {
        name: data.name,
        email: data.email,
        password: await hash.make(data.password),
        role_id: existentRole.id,
      };

      const newUser = await User.create(newUserPayload);

      const newuserResponse = {
        id: newUser.id,
        name: newUser.name,
      };

      if (!!newUser) {
        return SuccessReturn({ status: 201, msg: 'Success create user', res: response, data: newuserResponse });
      } else {
        return ErrorReturn({ status: 500, msg: 'Create user error', res: response });
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

      const existentUser = await User.query().where('id', parameters.id).preload('role').first();

      if (!existentUser) {
        return ErrorReturn({
          msg: 'Not fould user',
          res: response,
          status: 404,
          parameters: [{ message: 'Not found user', parameter: 'id' }],
        });
      }

      if (data.email) {
        const emailAlreadyInUse = await User.query().where('email', data.email).whereNot('id', parameters.id).first();

        if (emailAlreadyInUse) {
          return ErrorReturn({
            msg: 'Email already in use',
            status: 409,
            res: response,
            fields: [{ field: 'email', message: 'Email already in use' }],
          });
        }
      }

      if (data.role) {
        const newRole = await Role.findBy('name', data.role);
        if (!newRole) {
          return ErrorReturn({
            msg: 'Not valid rule',
            res: response,
            status: 404,
            fields: [{ field: 'role', message: 'Not valid rule' }],
          });
        }

        // evitar que o ADM troque a própria role e perda acesso ao sistema
        if (existentUser.id === authPayload.user_id && newRole.id !== existentUser.role_id) {
          return ErrorReturn({
            msg: 'You cannot change your own role to prevent losing access to the system.',
            res: response,
            status: 401,
            fields: [{ field: 'role', message: 'You cant change your own role' }],
          });
        }

        existentUser.merge({ role_id: newRole.id });

        const { role, ...filteredData } = data;
        data = filteredData;
      }

      try {
        existentUser.merge({ ...data });
        await existentUser.save();

        await existentUser.refresh();
        await existentUser.load('role');

        const returnPayload = {
          id: existentUser.id,
          name: existentUser.name,
          email: existentUser.email,
          role: existentUser.role.name,
        };
        return SuccessReturn({
          msg: 'Success update user',
          status: 200,
          res: response,
          data: returnPayload,
        });
      } catch (err) {
        return ErrorReturn({
          msg: 'Update user error',
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

      const existentUser = await User.query().where('id', parameters.id).preload('role').first();

      if (!existentUser) {
        return ErrorReturn({
          msg: 'Not fould user',
          res: response,
          status: 404,
          parameters: [{ message: 'Not found user', parameter: 'id' }],
        });
      }

      const returnPayload = {
        id: existentUser.id,
        name: existentUser.name,
        email: existentUser.email,
        role: existentUser.role.name,
        created_at: existentUser.created_at,
        updated_at: existentUser.updated_at,
      };

      return SuccessReturn({
        msg: 'Success get user data',
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

  public async delete({ response, authPayload, params }: HttpContext) {
    try {
      if (!authPayload) {
        return ErrorReturn({ res: response, status: 401, msg: 'Not authenticated', actions: { remove_token: true } });
      }

      const parameters = await deleteValidatorParameters.validate(params);
      const existentUser = await User.query().where('id', parameters.id).first();

      if (!existentUser) {
        return ErrorReturn({
          msg: 'Not fould user',
          res: response,
          status: 404,
          parameters: [{ message: 'Not found user', parameter: 'id' }],
        });
      }

      if (existentUser.id === authPayload.user_id) {
        return ErrorReturn({
          msg: "You can't self-delete",
          status: 401,
          res: response,
          parameters: [{ message: "You can't self-delete", parameter: 'id' }],
        });
      }
      try {
        await existentUser.delete();

        return SuccessReturn({
          msg: 'Success on delete user',
          res: response,
          status: 200,
        });
      } catch (err) {
        return ErrorReturn({
          msg: 'Error when deleting user',
          res: response,
          status: 400,
          parameters: [{ message: 'Error when deleting user', parameter: 'id' }],
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
