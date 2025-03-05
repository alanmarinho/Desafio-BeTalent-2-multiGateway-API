import hash from '@adonisjs/core/services/hash';
import { BaseSeeder } from '@adonisjs/lucid/seeders';

import Role, { RoleTypes } from '#models/role';
import User from '#models/user';

export default class UserSeeder extends BaseSeeder {
  public async run() {
    const adminRole = await Role.firstOrCreate({ name: RoleTypes.ADMIN });
    const userRole = await Role.firstOrCreate({ name: RoleTypes.USER });

    await User.firstOrCreate(
      { email: 'admin@email.com' },
      {
        name: 'Admin',
        email: 'admin@email.com',
        password: await hash.make('1234567Ab@'),
        role_id: adminRole.id,
      },
    );
  }
}
