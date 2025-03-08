import router from '@adonisjs/core/services/router';

import { middleware } from '#start/kernel';

const ClientController = () => import('#controllers/client_controller');

router
  .group(() => {
    router.get('/', [ClientController, 'index']);
    router.get('/:id', [ClientController, 'details']);
  })
  .prefix('/clients')
  .use(middleware.auth());
