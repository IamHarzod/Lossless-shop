import { Schema, Prop, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type UserDocument = User & Document;

export enum UserRole {
  CUSTOMER = 'customer',
  ADMIN = 'admin',
}

@Schema({ timestamps: true })
export class User {
  @Prop({ type: String, required: true, trim: true })
  fullName: string;

  @Prop({ type: String, required: true, unique: true, lowercase: true, trim: true })
  email: string;

  @Prop({ type: String, required: true, select: false })
  password: string;

  @Prop({ type: String, default: UserRole.CUSTOMER, enum: UserRole })
  role: UserRole;

  @Prop({ type: String, trim: true })
  phone?: string;

  @Prop({
    type: {
      street: { type: String },
      city: { type: String },
      district: { type: String },
      ward: { type: String },
    },
  })
  address?: {
    street?: string;
    city?: string;
    district?: string;
    ward?: string;
  };

  @Prop({ type: Boolean, default: true })
  isActive: boolean;

  @Prop({ type: Boolean, default: false })
  isDeleted: boolean;
}

export const UserSchema = SchemaFactory.createForClass(User);
