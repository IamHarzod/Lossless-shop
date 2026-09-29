import { Schema, Prop, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { User } from './user.schema.js';
import { Product } from './product.schema.js';

export type OrderDocument = Order & Document;

export enum OrderStatus {
  PENDING = 'pending',
  PAID = 'paid',
  PROCESSING = 'processing',
  SHIPPED = 'shipped',
  DELIVERED = 'delivered',
  CANCELLED = 'cancelled',
  REFUNDED = 'refunded',
}

export enum PaymentMethod {
  COD = 'cod',
  VNPAY = 'vnpay',
  MOMO = 'momo',
  STRIPE = 'stripe',
}

export enum PaymentStatus {
  PENDING = 'pending',
  PAID = 'paid',
  FAILED = 'failed',
  REFUNDED = 'refunded',
}

/** Snapshot of each ordered product (immutable record — products may be deleted/updated later) */
export class OrderItem {
  @Prop({ type: Types.ObjectId, ref: Product.name, required: true })
  product: Types.ObjectId;

  /** Product name snapshot at time of order */
  @Prop({ required: true })
  productName: string;

  /** Product image snapshot */
  @Prop()
  productImage?: string;

  @Prop({ required: true, min: 1 })
  quantity: number;

  /** Unit price at time of order */
  @Prop({ required: true, min: 0 })
  unitPrice: number;

  /** Subtotal = quantity × unitPrice */
  @Prop({ required: true, min: 0 })
  subtotal: number;
}

/** Shipping address snapshot (copied from user profile at checkout time) */
export class ShippingAddress {
  @Prop({ required: true }) recipientName: string;
  @Prop({ required: true }) phone: string;
  @Prop({ required: true }) street: string;
  @Prop({ required: true }) ward: string;
  @Prop({ required: true }) district: string;
  @Prop({ required: true }) city: string;
}

@Schema({ timestamps: true })
export class Order {
  /** Auto-generated order code (e.g. LS-20241025-0001) */
  @Prop({ required: true, unique: true })
  orderCode: string;

  @Prop({ type: Types.ObjectId, ref: User.name, required: true })
  user: Types.ObjectId;

  @Prop({ type: [OrderItem], required: true })
  items: OrderItem[];

  @Prop({ type: ShippingAddress, required: true })
  shippingAddress: ShippingAddress;

  @Prop({ required: true, min: 0 })
  subtotal: number;

  @Prop({ default: 0, min: 0 })
  shippingFee: number;

  @Prop({ default: 0, min: 0 })
  discountAmount: number;

  @Prop({ required: true, min: 0 })
  totalAmount: number;

  @Prop({ default: OrderStatus.PENDING, enum: OrderStatus })
  status: OrderStatus;

  @Prop({ required: true, enum: PaymentMethod })
  paymentMethod: PaymentMethod;

  @Prop({ default: PaymentStatus.PENDING, enum: PaymentStatus })
  paymentStatus: PaymentStatus;

  /** Transaction ID from payment gateway */
  @Prop({ trim: true })
  transactionId?: string;

  /** Admin notes (e.g. "Package damaged — refunded") */
  @Prop({ trim: true })
  adminNote?: string;

  /** Customer note at checkout */
  @Prop({ trim: true })
  customerNote?: string;

  /** Soft delete — orders are NEVER hard deleted */
  @Prop({ default: false })
  isDeleted: boolean;
}

export const OrderSchema = SchemaFactory.createForClass(Order);

OrderSchema.index({ user: 1, createdAt: -1 });
OrderSchema.index({ orderCode: 1 });
OrderSchema.index({ status: 1 });
OrderSchema.index({ paymentStatus: 1 });
