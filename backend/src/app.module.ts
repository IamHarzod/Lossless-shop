import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';

import { UsersModule } from './modules/users/users.module.js';
import { AuthModule } from './modules/auth/auth.module.js';
import { CategoriesModule } from './modules/categories/categories.module.js';
import { ProductsModule } from './modules/products/products.module.js';
import { UploadModule } from './modules/upload/upload.module.js';

@Module({
  imports: [
    // ─── Global Config (reads from .env) ───────────────────────────────────────
    ConfigModule.forRoot({
      isGlobal: true,    // Available in all modules without re-importing
      envFilePath: '.env',
    }),

    // ─── MongoDB Connection ─────────────────────────────────────────────────────
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        uri: configService.get<string>('MONGODB_URI'),
        // Connection pool settings for production readiness
        maxPoolSize: 10,
        serverSelectionTimeoutMS: 5000,
        socketTimeoutMS: 45000,
      }),
      inject: [ConfigService],
    }),

    // ─── Feature Modules (added progressively in each Lab) ─────────────────────
    UsersModule,
    AuthModule,
    CategoriesModule,
    ProductsModule,
    UploadModule,
    // Lab 4: OrdersModule, CartModule
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
