import { BaseSchema } from '@adonisjs/lucid/schema';
import { RoleTypes } from '#models/role';

const roleValues = Object.values(RoleTypes);

export default class extends BaseSchema {
  protected tableName = 'roles';

  async up() {
    this.schema.dropTableIfExists(this.tableName);
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id').primary();

      table.enum('name', roleValues).notNullable().unique();

      table.dateTime('created_at', { useTz: true }).defaultTo(this.now());
      table.dateTime('updated_at', { useTz: true }).defaultTo(this.now());
    });
  }

  async down() {
    this.schema.dropTable(this.tableName);
  }
}
