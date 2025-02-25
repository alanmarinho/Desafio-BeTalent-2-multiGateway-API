import { BaseSchema } from '@adonisjs/lucid/schema';

export default class extends BaseSchema {
  protected tableName = 'transaction_products';

  async up() {
    this.schema.dropTableIfExists(this.tableName);
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id').primary();

      table.integer('product_id').notNullable().unsigned().references('id').inTable('products').onDelete('CASCADE');
      table.integer('client_id').notNullable().unsigned().references('id').inTable('clients').onDelete('CASCADE');
      table
        .integer('transaction_id')
        .notNullable()
        .unsigned()
        .references('id')
        .inTable('transactions')
        .onDelete('CASCADE');

      table.dateTime('created_at', { useTz: true }).defaultTo(this.now());
      table.dateTime('updated_at', { useTz: true }).defaultTo(this.now());
    });
  }

  async down() {
    this.schema.dropTable(this.tableName);
  }
}
