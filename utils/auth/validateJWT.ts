import JWT from 'jsonwebtoken';

import { IJwtPayload } from '#utils/interfaces/interfaces';

enum EJwtReturn {
  Valid = 'Valid',
  Expired = 'Expired',
  Invalid = 'Invalid',
  Error = 'Error',
}

interface IValidateJWT {
  jwt: string;
  key: string;
}

export interface IPaylodToken {
  _id: string;
  sessionID: string;
}

function getJwtErrorType(err: any) {
  if (err instanceof JWT.TokenExpiredError) return 'TokenExpiredError';
  if (err instanceof JWT.JsonWebTokenError) return 'JsonWebTokenError';
  return 'OtherError';
}

export async function ValidateJWT({ jwt, key }: IValidateJWT) {
  let decodedJWT: IJwtPayload | null = null;
  let status: EJwtReturn = EJwtReturn.Error;

  try {
    decodedJWT = JWT.decode(jwt) as IJwtPayload;
    JWT.verify(jwt, key);
    status = EJwtReturn.Valid;
  } catch (err) {
    switch (getJwtErrorType(err)) {
      case 'TokenExpiredError':
        status = EJwtReturn.Expired;
        break;
      case 'JsonWebTokenError':
        status = EJwtReturn.Invalid;
        break;
      default:
        status = EJwtReturn.Invalid;
        break;
    }
  }
  return [decodedJWT, status];
}
