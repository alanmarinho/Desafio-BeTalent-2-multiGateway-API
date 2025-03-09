import hash from '@adonisjs/core/services/hash';
import { BaseSeeder } from '@adonisjs/lucid/seeders';

import Role, { RoleTypes } from '#models/role';
import User from '#models/user';

import env from '#start/env';

const ADM_NAME = env.get('ADM_NAME');
const ADM_EMAIL = env.get('ADM_EMAIL');
const ADM_PASSWORD = env.get('ADM_PASSWORD');
export default class UserSeeder extends BaseSeeder {
  public async run() {
    // roles
    const adminRole = await Role.firstOrCreate({ name: RoleTypes.ADMIN });
    const userRole = await Role.firstOrCreate({ name: RoleTypes.USER });

    // primeiro ADM
    const newADM = await User.firstOrCreate(
      { email: ADM_EMAIL },
      {
        name: ADM_NAME,
        email: ADM_EMAIL,
        password: await hash.make(ADM_PASSWORD),
        role_id: adminRole.id,
      },
    );
  }
}
