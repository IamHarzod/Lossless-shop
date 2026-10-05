import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Cart, CartSchema } from '../../schemas/cart.schema.js';
import { Product, ProductSchema } from '../../schemas/product.schema.js';
import { CartService } from './cart.service.js';
import { CartController } from './cart.controller.js';
import { OptionalJwtAuthGuard } from './guards/optional-jwt-auth.guard.js';
import { AuthModule } from '../auth/auth.module.js';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Cart.name, schema: CartSchema },
      { name: Product.name, schema: ProductSchema },
    ]),
    AuthModule,
  ],
  controllers: [CartController],
  providers: [CartService, OptionalJwtAuthGuard],
  exports: [CartService, MongooseModule],
})
export class CartModule {}
