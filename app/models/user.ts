import { DateTime } from 'luxon';
import { BaseModel, column } from '@adonisjs/lucid/orm';

export default class User extends BaseModel {
  @column({ isPrimary: true })
  declare id: number;

  @column()
  declare name: string;

  @column()
  declare email: string;

  @column({ serializeAs: null })
  declare password: string;

  @column()
  declare role_id: string;

  @column.dateTime({ autoCreate: true })
  declare created_at: DateTime;

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updated_at: DateTime | null;
}
