import { Schema, Prop, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { User } from './user.schema.js';
import { Product } from './product.schema.js';

export type CartDocument = Cart & Document;

/** A single item in the cart */
export class CartItem {
  @Prop({ type: Types.ObjectId, ref: Product.name, required: true })
  product: Types.ObjectId;

  @Prop({ required: true, min: 1 })
  quantity: number;

  /** Price snapshot at the time of adding to cart (avoids price fluctuation issues) */
  @Prop({ required: true, min: 0 })
  priceSnapshot: number;
}

@Schema({ timestamps: true })
export class Cart {
  /** Reference to authenticated user (null for guest carts) */
  @Prop({ type: Types.ObjectId, ref: User.name })
  user?: Types.ObjectId;

  /** Session ID for guest carts (used until user logs in) */
  @Prop({ trim: true })
  sessionId?: string;

  @Prop({ type: [CartItem], default: [] })
  items: CartItem[];

  /** Cached total for quick display (re-computed on item change) */
  @Prop({ default: 0 })
  totalAmount: number;
}

export const CartSchema = SchemaFactory.createForClass(Cart);

CartSchema.index({ user: 1 });
CartSchema.index({ sessionId: 1 });
