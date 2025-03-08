import type { NextFn } from '@adonisjs/core/types/http';
import type { HttpContext } from '@adonisjs/core/http';

import Session from '#models/session';

import jwt from 'jsonwebtoken';

import { decrypt } from '#utils/auth/encryptAndDecrypt';
import { ValidateJWT } from '#utils/auth/validateJWT';
import { ErrorReturn } from '#utils/errorReturn';
import { IJwtPayload } from '#utils/interfaces/interfaces';
import { RemoveSession } from '#utils/auth/removeSession';

import env from '#start/env';

import User from '#models/user';
import { RoleTypes } from '#models/role';

const APP_KEY = env.get('APP_KEY');

interface validadePermitionsProps {
  ctx: HttpContext;
  user_id: number;
}
const permissions: { [key: string]: { [key: string]: string[] } } = {
  ADMIN: {
    '*': ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'], // caso especial, ADM pode tudo.
  },
  USER: {
    '/auth/login': ['POST'],
    '/auth/logout': ['POST'],
    '/purchases/': ['POST', 'GET'],
  },
};

async function validadePermitions({ ctx, user_id }: validadePermitionsProps): Promise<boolean> {
  const user = await User.query().where('id', user_id).preload('role').first();

  if (!user) {
    return false;
  }

  const roleName = user.role.name;
  const url = ctx.request.url();
  const method = ctx.request.method();

  if (roleName === RoleTypes.ADMIN) {
    return permissions[roleName]?.['*']?.includes(method) || false;
  }

  if (roleName === RoleTypes.USER) {
    return permissions[roleName]?.[url]?.includes(method) || false;
  }

  return false;
}

export default class AuthMiddleware {
  async handle(ctx: HttpContext, next: NextFn) {
    try {
      const token = ctx.request.header('Authorization')?.split(' ')[1];

      if (!token) {
        return ErrorReturn({
          res: ctx.response,
          msg: 'Token not send',
          status: 401,
          actions: { remove_token: true },
        });
      }
      const tokenPayload = jwt.decode(token) as IJwtPayload;

      const userSession = await Session.findBy({ id: tokenPayload.session_id, user_id: tokenPayload.user_id });

      if (!userSession) {
        return ErrorReturn({
          res: ctx.response,
          status: 401,
          msg: 'Not authenticated',
          actions: { remove_token: true },
        });
      }

      const decriptedJwtKey = decrypt({ data: userSession.token_key, key: APP_KEY });

      const [payload, status] = await ValidateJWT({ jwt: token, key: decriptedJwtKey });
      switch (status) {
        case 'Valid':
          const jwtPayload = payload as IJwtPayload;

          const validPermissions = await validadePermitions({ ctx: ctx, user_id: jwtPayload.user_id });

          if (validPermissions) {
            ctx.authPayload = jwtPayload;
            await next();
          } else {
            return ErrorReturn({
              msg: 'Unauthorized',
              res: ctx.response,
              status: 401,
            });
          }
          break;
        case 'Expired':
          await RemoveSession({ session_id: tokenPayload.session_id });
          return ErrorReturn({
            res: ctx.response,
            msg: 'Expired token ',
            status: 401,
            actions: { remove_token: true },
          });

        case 'Invalid':
          await RemoveSession({ session_id: tokenPayload.session_id });
          return ErrorReturn({
            res: ctx.response,
            msg: 'Invalid token',
            status: 401,
            actions: { remove_token: true },
          });

        default:
          await RemoveSession({ session_id: tokenPayload.session_id });
          return ErrorReturn({
            res: ctx.response,
            msg: 'Token validation error',
            status: 500,
            actions: { remove_token: true },
          });
      }
    } catch (err) {
      return ErrorReturn({
        res: ctx.response,
        msg: 'Internal server error',
        status: 500,
      });
    }
  }
}
