import { Schema, Prop, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { Category } from './category.schema.js';

export type ProductDocument = Product & Document;

export class AudioSpecs {
  @Prop({ type: String }) impedance?: string;
  @Prop({ type: String }) frequencyResponse?: string;
  @Prop({ type: String }) driverType?: string;
  @Prop({ type: String }) driverSize?: string;
  @Prop({ type: String }) sensitivity?: string;
  @Prop({ type: String }) thd?: string;
  @Prop({ type: String }) cableLength?: string;
  @Prop({ type: String }) connector?: string;
  @Prop({ type: String }) weight?: string;
  @Prop({ type: String }) dacChip?: string;
  @Prop({ type: String }) outputPower?: string;
  @Prop({ type: String }) snr?: string;
}

@Schema({ timestamps: true })
export class Product {
  @Prop({ type: String, required: true, trim: true })
  name: string;

  @Prop({ type: String, required: true, trim: true, unique: true, lowercase: true })
  slug: string;

  @Prop({ type: String, required: true, trim: true })
  brand: string;

  @Prop({ type: String, trim: true })
  description?: string;

  @Prop({ type: Number, required: true, min: 0 })
  price: number;

  @Prop({ type: Number, min: 0 })
  salePrice?: number;

  @Prop({ type: Types.ObjectId, ref: Category.name, required: true })
  category: Types.ObjectId;

  @Prop({ type: [String], default: [] })
  images: string[];

  @Prop({ type: Number, default: 0, min: 0 })
  stock: number;

  @Prop({ type: Number, default: 0, min: 0, max: 5 })
  rating: number;

  @Prop({ type: Number, default: 0 })
  reviewCount: number;

  @Prop({ type: AudioSpecs })
  specs?: AudioSpecs;

  @Prop({ type: [String], default: [] })
  tags: string[];

  @Prop({ type: Boolean, default: false })
  isFeatured: boolean;

  @Prop({ type: Boolean, default: true })
  isActive: boolean;

  @Prop({ type: Boolean, default: false })
  isDeleted: boolean;
}

export const ProductSchema = SchemaFactory.createForClass(Product);

// Text index for full-text search (Lab 3+)
ProductSchema.index({ name: 'text', brand: 'text', description: 'text', tags: 'text' });
// Performance indexes
ProductSchema.index({ category: 1, isActive: 1, isDeleted: 1 });
ProductSchema.index({ price: 1 });
ProductSchema.index({ rating: -1 });
ProductSchema.index({ isFeatured: 1 });
