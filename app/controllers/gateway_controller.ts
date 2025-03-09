import AuthGatewayConfig from '#models/auth_gateway_config';
import AuthGatewayKeyValue from '#models/auth_gateway_key_value';
import Gateway from '#models/gateway';
import User from '#models/user';
import { decrypt, encrypt } from '#utils/auth/encryptAndDecrypt';
import { ErrorReturn } from '#utils/errorReturn';
import { FieldError } from '#utils/fieldErrorPatern';
import { SuccessReturn } from '#utils/successReturn';
import {
  activeStatusChangeParameters,
  deleteValidatorParameters,
  detailsValidatorParameters,
  priorityChange,
  registerValidator,
  showCredentials,
  updateCredentials,
  updateValidator,
} from '#validators/gateway';
import { HttpContext } from '@adonisjs/core/http';
import hash from '@adonisjs/core/services/hash';
import { errors } from '@vinejs/vine';
import env from '#start/env';
import { ParameterError } from '#utils/parameterErrorPatern';
const APP_KEY = env.get('APP_KEY');

interface IMoveGatewayToEnd {
  existentGateway: Gateway;
  lastPriority: number;
}
interface INewPriority {
  existentGateway: Gateway;
  newPriority: number;
}

interface IPriorityReorder {
  existentGateway: Gateway;
  newPriority: number;
}

async function reorderGatewayUp(priority: number) {
  await Gateway.query().where('priority', '>=', priority).orderBy('priority', 'desc').increment('priority', 1);
}
async function reorderGatewayDown(priority: number) {
  await Gateway.query().where('priority', '>', priority).orderBy('priority', 'asc').decrement('priority', 1);
}
async function moveGatewayToEnd({ existentGateway, lastPriority }: IMoveGatewayToEnd) {
  await existentGateway.merge({ priority: lastPriority }).save();
}
async function newPositionGateway({ existentGateway, newPriority }: INewPriority) {
  await existentGateway.merge({ priority: newPriority }).save();
}

async function gatewayPriorityReorder({ existentGateway, newPriority }: IPriorityReorder) {
  const maxPriority = await Gateway.query().max('priority as maxPriority');
  const lastPossiblePriority = ((maxPriority[0].$extras.maxPriority || 0) + 1) as number;

  const freePosition = await Gateway.query().where('priority', newPriority).first();
  const oldPriority = existentGateway.priority;

  if (!freePosition && newPriority >= lastPossiblePriority) {
    await moveGatewayToEnd({ existentGateway: existentGateway, lastPriority: lastPossiblePriority });
    await reorderGatewayDown(oldPriority);
    return existentGateway.refresh();
  }

  await moveGatewayToEnd({ existentGateway: existentGateway, lastPriority: lastPossiblePriority });
  await reorderGatewayDown(oldPriority);
  await reorderGatewayUp(newPriority);
  await newPositionGateway({ existentGateway: existentGateway, newPriority: newPriority });

  return existentGateway.refresh();
}

export default class GatewayController {
  public async index({ response, authPayload }: HttpContext) {
    try {
      if (!authPayload) {
        return ErrorReturn({ res: response, status: 401, msg: 'Not authenticated', actions: { remove_token: true } });
      }
      const gateways = await Gateway.query();

      const returnPayload = gateways.map((gateways) => ({
        id: gateways.id,
        name: gateways.name,
        is_active: gateways.is_active,
        priority: gateways.priority,
      }));

      return SuccessReturn({
        msg: 'Success get gateways',
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

  public async newGateways({ response, request, authPayload }: HttpContext) {
    try {
      if (!authPayload) {
        return ErrorReturn({ res: response, status: 401, msg: 'Not authenticated', actions: { remove_token: true } });
      }

      const data = await request.validateUsing(registerValidator);

      const { auth, credentials, ...config } = data;
      const authData = auth;
      const credentialsData = credentials;
      const configData = config;

      const existentGateway = await Gateway.query()
        .where((builder) => {
          builder.where('url', configData.url).andWhere('port', configData.port);
        })
        .orWhere('name', data.name)
        .first();

      if (existentGateway) {
        if (existentGateway.url === configData.url && existentGateway.port === configData.port) {
          return ErrorReturn({
            msg: 'URL and port already in use',
            res: response,
            status: 409,
            fields: [
              { field: 'url', message: 'Another gateway is using this same URL' },
              { field: 'port', message: 'Another gateway is using this same port' },
            ],
          });
        }

        if (existentGateway.name === data.name) {
          return ErrorReturn({
            msg: 'Gateway name already in use',
            res: response,
            status: 409,
            fields: [{ field: 'name', message: 'A gateway with this name already exists' }],
          });
        }
      }
      let gatewayPayload = {
        user_id: authPayload.user_id,
        name: configData.name,
        url: configData.url,
        port: configData.port,
        is_active: configData.is_active,
      };

      try {
        const newGateway = await Gateway.transaction(async (trx) => {
          let newPriority = configData.priority;
          let priorityInUse = false;

          if (!!newPriority) {
            const existendGateway = await Gateway.query().where('priority', newPriority).first();

            priorityInUse = !!existendGateway;
          }

          // cobre os casos: reordenação quando o priority já está em uso,
          // não reordena se o priority estiver livre e
          // adiciona menor prioridade se não for explicitamente definiado o priority.
          if (newPriority && priorityInUse) {
            await Gateway.query({ client: trx })
              .where('priority', '>=', configData.priority!)
              .orderBy('priority', 'desc')
              .increment('priority', 1);
          } else if (!newPriority) {
            const lastGateway = await Gateway.query({ client: trx }).orderBy('priority', 'desc').first();
            newPriority = lastGateway ? lastGateway.priority + 1 : 1;
          }
          return await Gateway.create({ ...gatewayPayload, priority: newPriority }, { client: trx });
        });

        if (!newGateway) {
          return ErrorReturn({
            msg: 'Failed to create new gateway',
            res: response,
            status: 500,
          });
        }

        const configPayload = {
          gateway_id: newGateway.id,
          user_id: authPayload.user_id,
          tokens_used_in: authData.need_login ? authData.tokens_used_in : undefined,
          expected_login_tokens_map: authData.need_login
            ? JSON.stringify(authData.expected_login_tokens_map)
            : undefined,
          need_login: authData.need_login,
        };

        const gatewayConfig = await AuthGatewayConfig.create(configPayload);

        const credentialsPayload = credentialsData.map((credential) => ({
          gateway_id: newGateway.id,
          user_id: authPayload.user_id,
          auth_gateway_config_id: gatewayConfig.id,
          key: credential.key,
          value: encrypt({ data: credential.value, key: APP_KEY }),
          use_in: credential.use_in,
          type: credential.type,
        }));

        await AuthGatewayKeyValue.createMany(credentialsPayload);

        const returnPayload = {
          id: newGateway.id,
          name: newGateway.name,
          priority: newGateway.priority,
          is_active: newGateway.is_active,
          need_login: gatewayConfig.need_login,
        };

        return SuccessReturn({
          msg: 'Success create new gateway',
          res: response,
          status: 201,
          data: returnPayload,
        });
      } catch (err) {
        return ErrorReturn({
          msg: 'Create Gateway error',
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
      const data = await request.validateUsing(updateValidator.updateValidatorBody);
      const parameters = await updateValidator.updateValidatorParameters.validate(params);

      if (Object.keys(data).length === 0) {
        return ErrorReturn({ status: 400, msg: 'Data not send', res: response });
      }
      const existentGateway = await Gateway.query().where('id', parameters.id).first();

      if (!existentGateway) {
        return ErrorReturn({
          msg: 'Gateway not found',
          status: 404,
          res: response,
          parameters: [{ message: 'Gateway not found', parameter: 'id' }],
        });
      }
      const { auth, ...config } = data;

      // analiza o conflito de url e ou port nas gateways
      if (config.port || config.url) {
        let hasConflict = false;
        let conflictField = [];

        if (config.port && config.url) {
          const conflictGatewayPortUrl = await Gateway.query()
            .where('port', config.port)
            .andWhere('url', config.url)
            .whereNot('id', existentGateway.id)
            .first();

          hasConflict = !hasConflict ? !!conflictGatewayPortUrl : hasConflict;
          conflictField.push(!!conflictGatewayPortUrl ? 'port' : null);
          conflictField.push(!!conflictGatewayPortUrl ? 'url' : null);
        } else {
          if (!!config.port) {
            const conflictGatewayPort = await Gateway.query()
              .where('port', config.port)
              .andWhere('url', existentGateway.url)
              .whereNot('id', existentGateway.id)
              .first();
            hasConflict = !hasConflict ? !!conflictGatewayPort : hasConflict;
            conflictField.push(!!conflictGatewayPort ? 'port' : null);
          }

          if (!!config.url) {
            const conflictGatewayUrl = await Gateway.query()
              .where('port', existentGateway.port)
              .andWhere('url', config.url)
              .whereNot('id', existentGateway.id)
              .first();

            hasConflict = !hasConflict ? !!conflictGatewayUrl : hasConflict;
            conflictField.push(!!conflictGatewayUrl ? 'url' : null);
          }
        }

        if (hasConflict) {
          const errorFields = conflictField.filter(Boolean).map((field) => ({
            field,
            message: `Another gateway is using this same ${field}`,
          }));
          return ErrorReturn({
            msg: 'Failed to update new gateway',
            res: response,
            status: 409,
            fields: errorFields,
          });
        }
      }

      if (!!config) {
        existentGateway.merge(config);
        await existentGateway.save();
        await existentGateway.refresh();
      }
      if (!!auth) {
        const { expected_login_tokens_map, ...authData } = auth;
        const existentAuth = await AuthGatewayConfig.query().where('gateway_id', existentGateway.id).first();

        existentAuth?.merge({
          expected_login_tokens_map: JSON.stringify(expected_login_tokens_map),
          ...authData,
        });
        await existentAuth?.save();
      }

      const returnPayload = {
        id: existentGateway.id,
        name: existentGateway.name,
      };

      return SuccessReturn({
        msg: 'Success update Gateway',
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

  public async details({ response, authPayload, params }: HttpContext) {
    try {
      if (!authPayload) {
        return ErrorReturn({ res: response, status: 401, msg: 'Not authenticated', actions: { remove_token: true } });
      }
      const parameters = await detailsValidatorParameters.validate(params);

      const existentGateway = await Gateway.query().where('id', parameters.id).first();

      if (!existentGateway) {
        return ErrorReturn({
          msg: 'Gateway not found',
          res: response,
          status: 404,
          parameters: [{ message: 'Gateway not found', parameter: 'id' }],
        });
      }

      const existentAuthConfig = await AuthGatewayConfig.query().where('gateway_id', existentGateway.id).first();
      const existentCredentials = await AuthGatewayKeyValue.query().where('gateway_id', existentGateway.id);

      const credentialsPayload = existentCredentials.map((credential) => ({
        id: credential.id,
        key: credential.key,
        value: 'hidden data',
      }));
      const authConfigPayload = {
        need_login: existentAuthConfig?.need_login,
        expected_login_tokens_map: JSON.parse(existentAuthConfig?.expected_login_tokens_map as string),
        tokens_used_in: existentAuthConfig?.tokens_used_in,
      };
      const returnPayload = {
        id: existentGateway.id,
        name: existentGateway.name,
        url: existentGateway.url,
        port: existentGateway.port,
        auth: authConfigPayload,
        credentials: credentialsPayload,
      };
      return SuccessReturn({
        msg: 'Success get gateway data',
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

      const existentGateway = await Gateway.query().where('id', parameters.id).first();

      if (!existentGateway) {
        return ErrorReturn({
          msg: 'Gateway not found',
          res: response,
          status: 404,
          parameters: [{ message: 'Gateway not found', parameter: 'id' }],
        });
      }
      try {
        await existentGateway.delete();

        return SuccessReturn({
          msg: 'Success on delete user',
          res: response,
          status: 204,
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

  public async showCredentials({ response, authPayload, request, params }: HttpContext) {
    try {
      if (!authPayload) {
        return ErrorReturn({ res: response, status: 401, msg: 'Not authenticated', actions: { remove_token: true } });
      }

      const data = await request.validateUsing(showCredentials.showCredentialsValidatorBody);
      const parameters = await showCredentials.showCredentialsValidatorParameters.validate(params);

      const existentGateway = await Gateway.query().where('id', parameters.id).first();

      if (!existentGateway) {
        return ErrorReturn({
          res: response,
          status: 401,
          msg: 'Gateway not found',
          parameters: [{ message: 'Gateway not found', parameter: 'id' }],
        });
      }

      const existentUser = await User.query().where('id', authPayload.user_id).first();

      if (!existentUser) {
        return ErrorReturn({
          res: response,
          status: 401,
          msg: 'Not authenticated',
          actions: { remove_token: true },
        });
      }

      const validPassword = await hash.verify(existentUser.password, data.password);

      if (!validPassword) {
        return ErrorReturn({
          res: response,
          status: 400,
          msg: 'Incorrect password',
          fields: [{ field: 'password', message: 'incorrect password' }],
        });
      }
      const existentCredentials = await AuthGatewayKeyValue.query().where('gateway_id', existentGateway.id);
      const returnPayload = existentCredentials.map((credential) => ({
        id: credential.id,
        key: credential.key,
        value: decrypt({ data: credential.value, key: APP_KEY }),
      }));
      return SuccessReturn({
        msg: 'Success get credentials data',
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

  public async activeStatusChange({ response, authPayload, params }: HttpContext) {
    try {
      if (!authPayload) {
        return ErrorReturn({ res: response, status: 401, msg: 'Not authenticated', actions: { remove_token: true } });
      }
      const parameters = await activeStatusChangeParameters.validate(params);

      const existentGateway = await Gateway.query().where('id', parameters.id).first();

      if (!existentGateway) {
        return ErrorReturn({
          res: response,
          status: 401,
          msg: 'Gateway not found',
          parameters: [{ message: 'Gateway not found', parameter: 'id' }],
        });
      }
      try {
        existentGateway.is_active = !existentGateway.is_active;
        const newGateway = await existentGateway.save();
        await existentGateway.refresh();

        const returnPayload = {
          id: newGateway.id,
          is_active: newGateway.is_active,
        };

        return SuccessReturn({
          msg: 'Success when changing gateway status',
          res: response,
          status: 200,
          data: returnPayload,
        });
      } catch (err) {
        return ErrorReturn({
          msg: 'Error when changing the gateway status',
          res: response,
          status: 400,
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

  public async priorityChange({ response, authPayload, request, params }: HttpContext) {
    try {
      if (!authPayload) {
        return ErrorReturn({ res: response, status: 401, msg: 'Not authenticated', actions: { remove_token: true } });
      }
      const parameters = await priorityChange.priorityChangeParameters.validate(params);
      const data = await request.validateUsing(priorityChange.priorityChangeBody);

      const existentGateway = await Gateway.query().where('id', parameters.id).first();

      if (!existentGateway) {
        return ErrorReturn({
          res: response,
          status: 401,
          msg: 'Gateway not found',
          parameters: [{ message: 'Gateway not found', parameter: 'id' }],
        });
      }

      const newGateway = await gatewayPriorityReorder({ existentGateway: existentGateway, newPriority: data.priority });

      if (newGateway) {
        const returnPayload = {
          id: newGateway.id,
          priority: newGateway.priority,
        };
        return SuccessReturn({
          msg: 'Success updade priority',
          res: response,
          status: 200,
          data: returnPayload,
        });
      } else {
        return ErrorReturn({
          msg: 'Update priority error',
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

  public async credentialsUpdate({ response, authPayload, request, params }: HttpContext) {
    try {
      if (!authPayload) {
        return ErrorReturn({ res: response, status: 401, msg: 'Not authenticated', actions: { remove_token: true } });
      }

      let data = await request.validateUsing(updateCredentials.updateCredentialsBody);
      const parameters = await updateCredentials.updateCredentialsParameters.validate(params);

      if (Object.keys(data).length === 0) {
        return ErrorReturn({ status: 400, msg: 'Data not send', res: response });
      }
      const existentCredential = await AuthGatewayKeyValue.query()
        .where('id', parameters.credential_id)
        .andWhere('gateway_id', parameters.id)
        .first();

      if (!existentCredential) {
        return ErrorReturn({
          msg: 'Credential not found',
          res: response,
          status: 404,
        });
      }
      try {
        if (data.value) {
          data.value = encrypt({ data: data.value, key: APP_KEY });
        }
        existentCredential.merge(data);
        await existentCredential.save();
        await existentCredential.refresh();

        const returnPayload = {
          id: existentCredential.id,
          gateway_id: existentCredential.gateway_id,
        };
        return SuccessReturn({
          msg: 'Success update credential',
          res: response,
          status: 200,
          data: returnPayload,
        });
      } catch (err) {
        return ErrorReturn({
          msg: 'Update credential error',
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
}
