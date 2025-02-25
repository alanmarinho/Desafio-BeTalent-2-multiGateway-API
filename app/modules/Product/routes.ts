import router from '@adonisjs/core/services/router';

import { middleware } from '#start/kernel';

const ProductController = () => import('#controllers/product_controller');

router
  .group(() => {
    router.get('/', [ProductController, 'index']);
  })
  .prefix('/products')
  .use(middleware.auth());
