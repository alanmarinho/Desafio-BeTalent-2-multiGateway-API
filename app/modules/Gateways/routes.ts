import router from '@adonisjs/core/services/router';

import { middleware } from '#start/kernel';

const GatewayController = () => import('#controllers/gateway_controller');

router
  .group(() => {
    router.get('/', [GatewayController, 'index']);
    router.post('/', [GatewayController, 'newGateways']);
    router.get('/:id', [GatewayController, 'details']);
    router.put('/:id', [GatewayController, 'update']);
    router.delete('/:id', [GatewayController, 'delete']);
    router.post('/:id/credentials', [GatewayController, 'showCredentials']);
    router.patch('/:id/priority', [GatewayController, 'priorityChange']);
    router.patch('/:id/status', [GatewayController, 'activeStatusChange']);
  })
  .prefix('/gateways')
  .use(middleware.auth());
