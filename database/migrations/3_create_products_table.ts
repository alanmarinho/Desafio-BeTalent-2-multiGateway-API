import { BaseSchema } from '@adonisjs/lucid/schema';

export default class extends BaseSchema {
  protected tableName = 'products';

  async up() {
    this.schema.dropTableIfExists(this.tableName);
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id').primary();
      table.integer('user_id').notNullable().unsigned().references('id').inTable('users').onDelete('CASCADE');

      table.string('name').notNullable();
      table.float('unit_price', 10, 2).notNullable().checkPositive();
      table.dateTime('deleted_in').nullable().defaultTo(null);

      table.dateTime('created_at', { useTz: true }).defaultTo(this.now());
      table.dateTime('updated_at', { useTz: true }).defaultTo(this.now());
    });
  }

  async down() {
    this.schema.dropTable(this.tableName);
  }
}
