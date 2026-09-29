import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';

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
    // Lab 2: AuthModule
    // Lab 3: UsersModule, CategoriesModule, ProductsModule, CartModule
    // Lab 4: OrdersModule
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
