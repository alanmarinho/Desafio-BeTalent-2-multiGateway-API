import router from '@adonisjs/core/services/router';

import { middleware } from '#start/kernel';

const UsersController = () => import('#controllers/users_controller');

router
  .group(() => {
    router.get('/', [UsersController, 'index']);
  })
  .prefix('/users')
  .use(middleware.auth());
