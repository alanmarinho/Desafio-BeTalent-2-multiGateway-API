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
        msg: 'Internal Serveer error',
      });
    }
  }
  // public async register({ response, request, authPayload }: HttpContext) {
  //   try {
  //     // if (!authPayload) {
  //     //   return ErrorReturn({ res: response, status: 401, msg: 'Not authenticated', actions: { remove_token: true } });
  //     // }
  //     const data = await request.validateUsing(registerValidator);

  //     const existentUser = await User.findBy('email', data.email);
  //     const existentRole = await Role.findBy('name', data.role);

  //     if (existentUser) {
  //       return ErrorReturn({
  //         res: response,
  //         status: 409,
  //         msg: 'Email already registered',
  //         fields: [{ field: 'email', message: 'Email already registered' }],
  //       });
  //     }

  //     if (!existentRole) {
  //       return ErrorReturn({
  //         res: response,
  //         status: 409,
  //         msg: 'Invalid role',
  //         fields: [{ field: 'role', message: 'Invalid role' }],
  //       });
  //     }
  //     const newUserPayload = {
  //       name: data.name,
  //       email: data.email,
  //       password: await hash.make(data.password),
  //       role_id: existentRole.id,
  //     };

  //     const newUser = await User.create(newUserPayload);

  //     const newuserResponse = {
  //       id: newUser.id,
  //       name: newUser.name,
  //     };

  //     if (!!newUser) {
  //       return SuccessReturn({ status: 201, msg: 'Success create user', res: response, data: newuserResponse });
  //     } else {
  //       return ErrorReturn({ status: 500, msg: 'Create user error', res: response });
  //     }
  //   } catch (err) {
  //     if (err instanceof errors.E_VALIDATION_ERROR) {
  //       return ErrorReturn({
  //         res: response,
  //         status: 400,
  //         msg: 'Validation Error',
  //         fields: FieldError(err.messages),
  //       });
  //     }
  //     return ErrorReturn({
  //       res: response,
  //       status: 500,
  //       msg: 'Internal Server error',
  //     });
  //   }
  // }
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
}
