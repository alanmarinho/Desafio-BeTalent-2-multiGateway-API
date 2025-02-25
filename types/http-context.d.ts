import { HttpContext } from '@adonisjs/core/http';
import { IJwtPayload } from '#utils/interfaces/interfaces';

// adiciona os dados de user altenticado do token JWT ao HttpContext
declare module '@adonisjs/core/http' {
  interface HttpContext {
    authPayload?: IJwtPayload;
  }
}
