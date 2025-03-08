import { BaseSchema } from '@adonisjs/lucid/schema';
import { StatusTypes } from '#models/transaction';

const statusTypes = Object.values(StatusTypes);

export default class extends BaseSchema {
  protected tableName = 'transactions';

  async up() {
    this.schema.dropTableIfExists(this.tableName);
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id').primary();

      table.integer('client_id').notNullable().unsigned().references('id').inTable('clients').onDelete('CASCADE');
      table.integer('gateway_id').notNullable().unsigned().references('id').inTable('gateways').onDelete('CASCADE');
      table.string('external_id').notNullable();
      table.enum('status', statusTypes).notNullable().defaultTo(StatusTypes.PENDING);
      table.float('amount').notNullable().checkPositive();
      table.string('card_last_numbers').notNullable();

      table.unique(['gateway_id', 'external_id']);

      table.dateTime('created_at', { useTz: true }).defaultTo(this.now());
      table.dateTime('updated_at', { useTz: true }).defaultTo(this.now());
    });
  }

  async down() {
    this.schema.dropTable(this.tableName);
  }
}
