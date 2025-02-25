import { DateTime } from 'luxon';

import { BaseModel, belongsTo, column } from '@adonisjs/lucid/orm';
import type { BelongsTo } from '@adonisjs/lucid/types/relations';

import User from './user.js';

export default class Gateway extends BaseModel {
  @column({ isPrimary: true })
  declare id: number;

  @column()
  declare user_id: number;

  @column()
  declare name: string;

  @column()
  declare is_active: boolean;

  @column()
  declare priority: number;

  @column.dateTime({ autoCreate: true })
  declare created_at: DateTime;

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updated_at: DateTime;

  @belongsTo(() => User, { foreignKey: 'user_id' })
  public user!: BelongsTo<typeof User>;
}
