import router from '@adonisjs/core/services/router';

import { middleware } from '#start/kernel';

const UsersController = () => import('#controllers/users_controller');

router
  .group(() => {
    router.get('/', [UsersController, 'index']);
    router.post('/', [UsersController, 'register']);
    router.put('/:id', [UsersController, 'update']);
    router.get('/:id', [UsersController, 'details']);
    router.delete('/:id', [UsersController, 'delete']);
  })
  .prefix('/users')
  .use(middleware.auth());
