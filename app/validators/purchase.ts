import vine from '@vinejs/vine';

const creditCardValidator = vine.object({
  number: vine
    .string()
    .creditCard()
    .transform((value) => value.replace(/\s+/g, '')),
  cvv: vine.string().regex(/^\d{3,4}$/),
});
const productValidator = vine.object({
  product_id: vine.number().positive(),
  quantity: vine.number().positive(),
});

export const newPurchaseValidator = vine.compile(
  vine.object({
    products: vine.array(productValidator),
    credit_card: creditCardValidator,
  }),
);

export const reimbursementValidatorParams = vine.compile(
  vine.object({
    id: vine.number().positive(),
  }),
);
