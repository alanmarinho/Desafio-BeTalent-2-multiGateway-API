import router from '@adonisjs/core/services/router';

import { middleware } from '#start/kernel';

const PurchaseController = () => import('#controllers/purchase_controller');

router
  .group(() => {
    router.get('/', [PurchaseController, 'index']);
    router.post('/', [PurchaseController, 'newPurchase']);
    router.post('/:id/reimbursement', [PurchaseController, 'reimbursement']);
  })
  .prefix('/purchases')
  .use(middleware.auth());
