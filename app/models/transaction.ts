import { DateTime } from 'luxon';
import { BaseModel, column } from '@adonisjs/lucid/orm';

export enum StatusTypes {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  FAILED = 'FAILED',
  CANCELED = 'CANCELED',
  REFUNDED = 'REFUNDED',
}

export default class Transaction extends BaseModel {
  @column({ isPrimary: true })
  declare id: number;

  @column()
  declare client_id: number;

  @column()
  declare gateway_id: number;

  @column()
  declare external_id: string;

  @column()
  declare status: StatusTypes;

  @column()
  declare amount: number;

  @column()
  declare card_last_numbers: string;

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime;

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime;
}
