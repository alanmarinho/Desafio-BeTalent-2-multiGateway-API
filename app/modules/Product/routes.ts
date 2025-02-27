import router from '@adonisjs/core/services/router';

import { middleware } from '#start/kernel';

const ProductController = () => import('#controllers/product_controller');

router
  .group(() => {
    router.get('/', [ProductController, 'index']);
    router.post('/', [ProductController, 'newProduct']);
  })
  .prefix('/products')
  .use(middleware.auth());
