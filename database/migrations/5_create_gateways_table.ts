import { BaseSchema } from '@adonisjs/lucid/schema';

export default class extends BaseSchema {
  protected tableName = 'gateways';

  async up() {
    this.schema.dropTableIfExists(this.tableName);
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id').primary();

      table.integer('user_id').notNullable().unsigned().references('id').inTable('users').onDelete('CASCADE');
      table.string('name').notNullable().unique();
      table.string('url').notNullable();
      table.string('port').notNullable().checkPositive();
      table.boolean('is_active').notNullable().defaultTo(false);
      table.integer('priority').unique().notNullable().checkPositive().defaultTo(1);

      table.unique(['port', 'url']);
      table.dateTime('created_at', { useTz: true }).defaultTo(this.now());
      table.dateTime('updated_at', { useTz: true }).defaultTo(this.now());
    });
  }

  async down() {
    this.schema.dropTable(this.tableName);
  }
}
