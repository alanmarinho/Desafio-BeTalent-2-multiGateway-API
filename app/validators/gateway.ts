import vine from '@vinejs/vine';
import { UseExpectedTokensIn } from '#models/auth_gateway_config';
import { UsekeyValueIn, TypeKeyValue } from '#models/auth_gateway_key_value';

const registerAuthConfigValidator = vine.object({
  need_login: vine.boolean(),
  tokens_used_in: vine.enum(UseExpectedTokensIn).optional().requiredWhen('need_login', '=', true),
  expected_login_tokens_map: vine.record(vine.string()).optional().requiredWhen('need_login', '=', true),
});

const registerKeyvalueValidator = vine.object({
  key: vine.string(),
  value: vine.string(),
  use_in: vine.enum(UsekeyValueIn),
  type: vine.enum(TypeKeyValue),
});

export const registerValidator = vine.compile(
  vine.object({
    name: vine.string().trim().maxLength(60),
    is_active: vine.boolean(),
    priority: vine.number().optional(),
    url: vine.string().regex(/^https?:\/\/(localhost|([a-z0-9.-]+))(:[0-9]+)?(\/.*)?$/i),
    port: vine.string().regex(/^[0-9]+$/),
    auth: registerAuthConfigValidator,
    credentials: vine.array(registerKeyvalueValidator),
  }),
);

const updateAuthConfigValidator = vine.object({
  need_login: vine.boolean().optional(),
  tokens_used_in: vine.enum(UseExpectedTokensIn).optional(),
  expected_login_tokens_map: vine.record(vine.string()).optional().requiredWhen('need_login', '=', true),
});

const updateKeyvalueValidator = vine.object({
  key: vine.string().optional(),
  value: vine.string().optional(),
  use_in: vine.enum(UsekeyValueIn).optional(),
  type: vine.enum(TypeKeyValue).optional(),
});

const updateValidatorBody = vine.compile(
  vine.object({
    name: vine.string().trim().maxLength(60).optional(),
    is_active: vine.boolean().optional(),
    priority: vine.number().optional(),
    url: vine
      .string()
      .regex(/^https?:\/\/(localhost|([a-z0-9.-]+))(:[0-9]+)?(\/.*)?$/i)
      .optional(),

    port: vine
      .string()
      .regex(/^[0-9]+$/)
      .optional(),
    auth: updateAuthConfigValidator.optional(),
  }),
);

const updateValidatorParameters = vine.compile(
  vine.object({
    id: vine.number().positive(),
  }),
);

const showCredentialsValidatorBody = vine.compile(
  vine.object({
    password: vine.string().trim(),
  }),
);

const showCredentialsValidatorParameters = vine.compile(
  vine.object({
    id: vine.number().positive(),
  }),
);

export const detailsValidatorParameters = vine.compile(
  vine.object({
    id: vine.number().positive(),
  }),
);
export const deleteValidatorParameters = vine.compile(
  vine.object({
    id: vine.number().positive(),
  }),
);
export const activeStatusChangeParameters = vine.compile(
  vine.object({
    id: vine.number().positive(),
  }),
);
const priorityChangeParameters = vine.compile(
  vine.object({
    id: vine.number().positive(),
  }),
);
const priorityChangeBody = vine.compile(
  vine.object({
    priority: vine.number().positive(),
  }),
);

const updateCredentialsParameters = vine.compile(
  vine.object({
    id: vine.number().positive(),
    credential_id: vine.number().positive(),
  }),
);
const updateCredentialsBody = vine.compile(
  vine.object({
    key: vine.string().optional(),
    value: vine.string().optional(),
    use_in: vine.enum(UsekeyValueIn).optional(),
    type: vine.enum(TypeKeyValue).optional(),
  }),
);

export const priorityChange = { priorityChangeBody, priorityChangeParameters };
export const updateValidator = { updateValidatorBody, updateValidatorParameters };
export const showCredentials = { showCredentialsValidatorParameters, showCredentialsValidatorBody };
export const updateCredentials = { updateCredentialsParameters, updateCredentialsBody };
