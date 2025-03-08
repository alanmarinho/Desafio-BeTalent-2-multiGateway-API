import { DateTime } from 'luxon';

import { BaseModel, belongsTo, column } from '@adonisjs/lucid/orm';
import type { BelongsTo } from '@adonisjs/lucid/types/relations';

import Product from './product.js';
import Client from './client.js';
import Transaction from './transaction.js';

export default class TransactionProduct extends BaseModel {
  @column({ isPrimary: true })
  declare id: number;

  @column()
  declare product_id: number;

  @column()
  declare client_id: number;

  @column()
  declare transaction_id: number;

  @column()
  declare unit_price: number;

  @column()
  declare quantity: number;

  @column.dateTime({ autoCreate: true })
  declare created_at: DateTime;

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updated_at: DateTime;

  @belongsTo(() => Product, { foreignKey: 'product_id' })
  public product!: BelongsTo<typeof Product>;

  @belongsTo(() => Client, { foreignKey: 'client_id' })
  public client!: BelongsTo<typeof Client>;

  @belongsTo(() => Transaction, { foreignKey: 'transaction_id' })
  public transaction!: BelongsTo<typeof Transaction>;
}
