import { Schema, Prop, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { Category } from './category.schema.js';

export type ProductDocument = Product & Document;

/**
 * Audiophile-specific technical specifications sub-document.
 * All fields are optional since not every category has the same specs.
 */
export class AudioSpecs {
  /** Impedance in Ohms (e.g., 32, 150, 300) */
  @Prop() impedance?: string;
  /** Frequency response range (e.g., "20Hz - 20kHz") */
  @Prop() frequencyResponse?: string;
  /** Driver type (e.g., "Dynamic", "Balanced Armature", "Planar Magnetic") */
  @Prop() driverType?: string;
  /** Driver size in mm */
  @Prop() driverSize?: string;
  /** Sensitivity in dB/mW */
  @Prop() sensitivity?: string;
  /** Total Harmonic Distortion */
  @Prop() thd?: string;
  /** Cable length */
  @Prop() cableLength?: string;
  /** Connector type (e.g., "3.5mm TRS", "4.4mm Pentaconn", "2-pin 0.78mm") */
  @Prop() connector?: string;
  /** Weight in grams */
  @Prop() weight?: string;
  /** DAC chip model (for DAC/Amp products, e.g., "ES9038PRO") */
  @Prop() dacChip?: string;
  /** Output power in mW */
  @Prop() outputPower?: string;
  /** SNR (Signal-to-Noise Ratio) */
  @Prop() snr?: string;
}

@Schema({ timestamps: true })
export class Product {
  @Prop({ required: true, trim: true })
  name: string;

  @Prop({ required: true, trim: true, unique: true, lowercase: true })
  slug: string;

  @Prop({ required: true, trim: true })
  brand: string;

  @Prop({ trim: true })
  description?: string;

  @Prop({ required: true, min: 0 })
  price: number;

  /** Discounted price (optional sale price) */
  @Prop({ min: 0 })
  salePrice?: number;

  @Prop({ type: Types.ObjectId, ref: Category.name, required: true })
  category: Types.ObjectId;

  /** Array of image URLs (first image is the primary/thumbnail) */
  @Prop({ type: [String], default: [] })
  images: string[];

  @Prop({ default: 0, min: 0 })
  stock: number;

  /** Average rating (0 - 5) */
  @Prop({ default: 0, min: 0, max: 5 })
  rating: number;

  /** Number of reviews */
  @Prop({ default: 0 })
  reviewCount: number;

  /** Audiophile-specific technical specifications */
  @Prop({ type: AudioSpecs })
  specs?: AudioSpecs;

  /** Tags for SEO and filtering (e.g., ["audiophile", "hifi", "planar"]) */
  @Prop({ type: [String], default: [] })
  tags: string[];

  /** Whether product is featured on homepage */
  @Prop({ default: false })
  isFeatured: boolean;

  @Prop({ default: true })
  isActive: boolean;

  /** Soft delete flag — never hard delete product records */
  @Prop({ default: false })
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
