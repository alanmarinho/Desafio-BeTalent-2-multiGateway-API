import type { NextFn } from '@adonisjs/core/types/http';
import type { HttpContext } from '@adonisjs/core/http';
import { ErrorReturn } from '#utils/errorReturn';

export default class NotFoundHandler {
  public async handle({ response }: HttpContext, next: NextFn) {
    await next();

    // retorno padrão para rotas não encontradas (evitar retornar dados detalhados) e diferenciar rota não encontrada de retorno status 404 de controller.
    if (!!response.notFound && !response.ctx?.route) {
      return ErrorReturn({ msg: 'Route not found', status: 404, res: response });
    }
  }
}
