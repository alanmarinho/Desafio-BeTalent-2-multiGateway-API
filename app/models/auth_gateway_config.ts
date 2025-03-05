import { DateTime } from 'luxon';
import { BaseModel, belongsTo, column } from '@adonisjs/lucid/orm';
import type { BelongsTo } from '@adonisjs/lucid/types/relations';
import User from './user.js';
import Gateway from './gateway.js';

export enum UseExpectedTokensIn {
  BEARER = 'BEARER',
  HEADER = 'HEADER',
  QUERY = 'QUERY ',
  BODY = 'BODY',
}

export default class AuthGatewayConfig extends BaseModel {
  @column({ isPrimary: true })
  declare id: number;

  @column()
  declare gateway_id: number;

  @column()
  declare user_id: number;

  @column()
  declare tokens_used_in: UseExpectedTokensIn;

  @column()
  declare expected_login_tokens_map: JSON;

  @column()
  declare need_login: boolean;

  @column.dateTime({ autoCreate: true })
  declare created_at: DateTime;

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updated_at: DateTime;

  @belongsTo(() => User, { foreignKey: 'user_id' })
  public user!: BelongsTo<typeof User>;

  @belongsTo(() => Gateway, { foreignKey: 'gateway_id' })
  public gateway!: BelongsTo<typeof Gateway>;
}
