import { DateTime } from 'luxon';
import { BaseModel, column } from '@adonisjs/lucid/orm';
export enum RoleTypes {
  ADMIN = 'ADMIN',
  USER = 'USER',
}

export default class Role extends BaseModel {
  @column({ isPrimary: true })
  declare id: number;

  @column()
  declare name: RoleTypes;

  @column.dateTime({ autoCreate: true })
  declare created_at: DateTime;

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare created_at: DateTime;
}
