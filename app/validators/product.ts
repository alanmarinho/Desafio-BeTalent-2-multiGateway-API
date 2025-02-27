import vine from '@vinejs/vine';

export const registerValidator = vine.compile(
  vine.object({
    name: vine.string().trim().maxLength(60),
    unit_price: vine.number().positive(),
  }),
);

const updateValidatorBody = vine.compile(
  vine.object({
    name: vine.string().trim().maxLength(60).optional(),
    unit_price: vine.number().positive().optional(),
  }),
);

const updateValidatorParameters = vine.compile(
  vine.object({
    id: vine.number().positive(),
  }),
);

export const detailsValidatorParameters = vine.compile(
  vine.object({
    id: vine.number().positive(),
  }),
);

export const restoreValidatorParameters = vine.compile(
  vine.object({
    id: vine.number().positive(),
  }),
);

export const deleteValidatorParameters = vine.compile(
  vine.object({
    id: vine.number().positive(),
  }),
);

export const updateValidator = { updateValidatorBody, updateValidatorParameters };
