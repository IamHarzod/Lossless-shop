import { Schema, Prop, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type CategoryDocument = Category & Document;

@Schema({ timestamps: true })
export class Category {
  @Prop({ required: true, trim: true, unique: true })
  name: string;

  /**
   * URL-friendly slug for routing (e.g. "headphones", "iems", "dac-amp")
   */
  @Prop({ required: true, trim: true, unique: true, lowercase: true })
  slug: string;

  @Prop({ trim: true })
  description?: string;

  @Prop({ trim: true })
  imageUrl?: string;

  @Prop({ default: true })
  isActive: boolean;

  @Prop({ default: false })
  isDeleted: boolean;
}

export const CategorySchema = SchemaFactory.createForClass(Category);
