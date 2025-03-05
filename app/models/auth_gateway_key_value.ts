import { DateTime } from 'luxon';
import { BaseModel, belongsTo, column } from '@adonisjs/lucid/orm';
import type { BelongsTo } from '@adonisjs/lucid/types/relations';
import User from './user.js';
import Gateway from './gateway.js';
import AuthGatewayConfig from './auth_gateway_config.js';

export enum UsekeyValueIn {
  HEADER = 'HEADER',
  QUERY = 'QUERY ',
  BODY = 'BODY',
}

export enum TypeKeyValue {
  TOKEN = 'TOKEN',
  LOGIN = 'LOGIN',
}

export default class AuthGatewayKeyValue extends BaseModel {
  @column({ isPrimary: true })
  declare id: number;

  @column()
  declare user_id: number;

  @column()
  declare auth_gateway_config_id: number;

  @column()
  declare gateway_id: number;

  @column()
  declare key: string;

  @column({ serializeAs: null })
  declare value: string;

  @column()
  declare use_in: UsekeyValueIn;

  @column()
  declare type: TypeKeyValue;

  @column.dateTime({ autoCreate: true })
  declare created_at: DateTime;

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updated_at: DateTime;

  @belongsTo(() => User, { foreignKey: 'user_id' })
  public user!: BelongsTo<typeof User>;

  @belongsTo(() => Gateway, { foreignKey: 'gateway_id' })
  public gateway!: BelongsTo<typeof Gateway>;

  @belongsTo(() => AuthGatewayConfig, { foreignKey: 'auth_gateway_config_id' })
  public config!: BelongsTo<typeof AuthGatewayConfig>;
}
