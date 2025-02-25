import type { Response } from '@adonisjs/core/http';

interface IParameterError {
  message: string;
  parameter: string | null;
}

export interface IFieldError {
  message: string;
  field: string | null;
}

interface IErrorActions {
  remove_token?: boolean;
}

interface IErrorReturn {
  res: Response;
  status: number;
  msg: string;
  fields?: IFieldError[];
  parameters?: IParameterError[];
  actions?: IErrorActions;
}

export function ErrorReturn({ msg, fields, actions, res, status, parameters }: IErrorReturn) {
  const errorReturn = {
    msg: msg,
    status: status,
    ...(fields && { fields: fields }),
    ...(actions && { actions: actions }),
    ...(parameters && { parameters: parameters }),
  };
  res.status(status).json(errorReturn);
}
