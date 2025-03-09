import { middleware } from '#start/kernel';
import router from '@adonisjs/core/services/router';

const AuthController = () => import('#controllers/auth_controller');

router
  .group(() => {
    router.post('/login', [AuthController, 'login']);
    router.post('/logout', [AuthController, 'logout']).use(middleware.auth());
  })
  .prefix('/auth');
