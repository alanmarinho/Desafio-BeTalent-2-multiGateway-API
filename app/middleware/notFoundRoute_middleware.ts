import type { NextFn } from '@adonisjs/core/types/http';
import type { HttpContext } from '@adonisjs/core/http';
import { ErrorReturn } from '#utils/errorReturn';

export default class NotFoundHandler {
  public async handle({ response }: HttpContext, next: NextFn) {
    await next();

    if (response.response.statusCode === 404) {
      return ErrorReturn({ msg: 'Route not found', status: 404, res: response });
    }
  }
}
