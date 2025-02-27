import { RoleTypes } from '#models/role';
import vine from '@vinejs/vine';

export const registerValidator = vine.compile(
  vine.object({
    email: vine.string().trim().email().normalizeEmail(),
    password: vine
      .string()
      .trim()
      .maxLength(100)
      .regex(/^\S*(?=\S{6,})(?=\S*\d)(?=\S*[A-Z])(?=\S*[a-z])(?=\S*[!@#$%^&*? ])\S*$/), // senha forte min 6 caracteres e pelomenos: 1 letra minúscula, 1 maiúscula, 1 numero, um caractere especial. by: https://regexpattern.com/strong-password/
    name: vine
      .string()
      .trim()
      .maxLength(60)
      .regex(/^[a-zA-ZÀ-ÿ\s]+$/), //somente letas e espaços

    role: vine.enum(RoleTypes),
  }),
);

const updateValidatorBody = vine.compile(
  vine.object({
    email: vine.string().trim().email().normalizeEmail().optional(),
    password: vine
      .string()
      .trim()
      .maxLength(100)
      .regex(/^\S*(?=\S{6,})(?=\S*\d)(?=\S*[A-Z])(?=\S*[a-z])(?=\S*[!@#$%^&*? ])\S*$/)
      .optional(),
    name: vine
      .string()
      .trim()
      .maxLength(60)
      .regex(/^[a-zA-ZÀ-ÿ\s]+$/)
      .optional(),

    role: vine.enum(RoleTypes).optional(),
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
export const deleteValidatorParameters = vine.compile(
  vine.object({
    id: vine.number().positive(),
  }),
);

export const updateValidator = {
  updateValidatorBody,
  updateValidatorParameters,
};
