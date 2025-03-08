import { DateTime } from 'luxon';
import { BaseModel, belongsTo, column } from '@adonisjs/lucid/orm';
import type { BelongsTo } from '@adonisjs/lucid/types/relations';
import Gateway from './gateway.js';

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
  declare created_at: DateTime;

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updated_at: DateTime;

  @belongsTo(() => Gateway, { foreignKey: 'gateway_id' })
  public gateway!: BelongsTo<typeof Gateway>;
}
