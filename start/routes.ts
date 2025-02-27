/*
|--------------------------------------------------------------------------
| Routes file
|--------------------------------------------------------------------------
|
| The routes file is used for defining the HTTP routes.
|
*/

import router from '@adonisjs/core/services/router';

import '#modules/User/routes';
import '#modules/Product/routes';
import '#modules/Auth/routes';

router.get('/', async () => {
  return {
    hello: 'world',
  };
});
