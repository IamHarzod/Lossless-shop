/**
 * Central export barrel for all Mongoose schemas.
 * Import from here instead of individual files.
 *
 * Usage:
 *   import { User, UserSchema, UserDocument } from '@/schemas/index.js';
 */

export * from './user.schema.js';
export * from './category.schema.js';
export * from './product.schema.js';
export * from './cart.schema.js';
export * from './order.schema.js';
