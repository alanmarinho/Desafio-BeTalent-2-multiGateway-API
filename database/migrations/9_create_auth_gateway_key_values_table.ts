import { UsekeyValueIn, TypeKeyValue } from '#models/auth_gateway_key_value';

import { BaseSchema } from '@adonisjs/lucid/schema';

const UsekeyValueIn_values = Object.values(UsekeyValueIn);
const TypeKeyValue_values = Object.values(TypeKeyValue);

export default class extends BaseSchema {
  protected tableName = 'auth_gateway_key_values';

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id').primary();

      table.integer('user_id').notNullable().unsigned().references('id').inTable('users').onDelete('CASCADE');
      table
        .integer('auth_gateway_config_id')
        .notNullable()
        .unsigned()
        .references('id')
        .inTable('auth_gateway_configs')
        .onDelete('CASCADE');
      table.integer('gateway_id').notNullable().unsigned().references('id').inTable('gateways').onDelete('CASCADE');
      table.string('key');
      table.string('value');
      table.enum('use_in', UsekeyValueIn_values).notNullable();
      table.enum('type', TypeKeyValue_values).notNullable();

      table.dateTime('created_at', { useTz: true }).defaultTo(this.now());
      table.dateTime('updated_at', { useTz: true }).defaultTo(this.now());
    });
  }

  async down() {
    this.schema.dropTable(this.tableName);
  }
}
