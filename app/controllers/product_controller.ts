import { HttpContext } from '@adonisjs/core/http';

export default class ProductController {
  public async index({ response, request }: HttpContext) {
    console.log('get all products');
  }
  public async newProduct({ response, request }: HttpContext) {
    console.log('post new product');
  }
}
