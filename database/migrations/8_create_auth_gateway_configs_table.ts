import { UseExpectedTokensIn } from '#models/auth_gateway_config';

import { BaseSchema } from '@adonisjs/lucid/schema';

const UseExpectedTokensInValues = Object.values(UseExpectedTokensIn);

export default class extends BaseSchema {
  protected tableName = 'auth_gateway_configs';

  async up() {
    this.schema.dropTableIfExists(this.tableName);
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id').primary();

      table.integer('user_id').notNullable().unsigned().references('id').inTable('users').onDelete('CASCADE');
      table.integer('gateway_id').notNullable().unsigned().references('id').inTable('gateways').onDelete('CASCADE');
      table.enum('tokens_used_in', UseExpectedTokensInValues).notNullable();
      table.json('expected_login_tokens_map').nullable().defaultTo(null);
      table.boolean('need_login').notNullable().defaultTo(false);

      table.dateTime('created_at', { useTz: true }).defaultTo(this.now());
      table.dateTime('updated_at', { useTz: true }).defaultTo(this.now());
    });
  }

  async down() {
    this.schema.dropTable(this.tableName);
  }
}
