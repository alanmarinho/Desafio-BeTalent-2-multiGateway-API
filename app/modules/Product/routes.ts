import router from '@adonisjs/core/services/router';

import { middleware } from '#start/kernel';

const ProductController = () => import('#controllers/product_controller');

router
  .group(() => {
    router.get('/', [ProductController, 'index']);
    router.post('/', [ProductController, 'newProduct']);
    router.get('/:id', [ProductController, 'details']);
    router.put('/:id', [ProductController, 'update']);
    router.delete('/:id', [ProductController, 'softDelete']);
    router.patch('/:id/restore', [ProductController, 'restore']);
  })
  .prefix('/products')
  .use(middleware.auth());
