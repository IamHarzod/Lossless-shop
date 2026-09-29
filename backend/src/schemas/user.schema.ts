import { Schema, Prop, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type UserDocument = User & Document;

export enum UserRole {
  CUSTOMER = 'customer',
  ADMIN = 'admin',
}

@Schema({ timestamps: true })
export class User {
  @Prop({ required: true, trim: true })
  fullName: string;

  @Prop({ required: true, unique: true, lowercase: true, trim: true })
  email: string;

  @Prop({ required: true, select: false })
  password: string;

  @Prop({ default: UserRole.CUSTOMER, enum: UserRole })
  role: UserRole;

  @Prop({ trim: true })
  phone?: string;

  @Prop({
    type: {
      street: String,
      city: String,
      district: String,
      ward: String,
    },
  })
  address?: {
    street: string;
    city: string;
    district: string;
    ward: string;
  };

  @Prop({ default: true })
  isActive: boolean;

  @Prop({ default: false })
  isDeleted: boolean;
}

export const UserSchema = SchemaFactory.createForClass(User);
