import vine from '@vinejs/vine';

export const detailsValidatorParams = vine.compile(
  vine.object({
    id: vine.number().positive(),
  }),
);
