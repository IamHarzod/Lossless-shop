import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { CartService } from './cart.service.js';
import { AddToCartDto } from './dto/add-to-cart.dto.js';
import { UpdateCartItemDto } from './dto/update-cart-item.dto.js';
import { MergeCartDto } from './dto/merge-cart.dto.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { OptionalJwtAuthGuard } from './guards/optional-jwt-auth.guard.js';
import { CurrentUser } from '../auth/decorators/current-user.decorator.js';
import type { UserDocument } from '../../schemas/user.schema.js';

@Controller('cart')
export class CartController {
  constructor(private readonly cartService: CartService) {}

  /**
   * Lấy giỏ hàng hiện tại (hỗ trợ cả tài khoản đăng nhập hoặc session khách vãng lai)
   * GET /api/v1/cart?sessionId=...
   */
  @Get()
  @UseGuards(OptionalJwtAuthGuard)
  async getCart(
    @CurrentUser() user: UserDocument | null,
    @Query('sessionId') sessionId?: string,
  ) {
    const userId = user ? user._id.toString() : undefined;
    return this.cartService.getCart(userId, sessionId);
  }

  /**
   * Thêm sản phẩm vào giỏ hàng
   * POST /api/v1/cart/items
   */
  @Post('items')
  @UseGuards(OptionalJwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async addItem(
    @CurrentUser() user: UserDocument | null,
    @Body() addToCartDto: AddToCartDto,
  ) {
    const userId = user ? user._id.toString() : undefined;
    return this.cartService.addItem(addToCartDto, userId);
  }

  /**
   * Cập nhật số lượng của một sản phẩm trong giỏ hàng
   * PATCH /api/v1/cart/items/:productId
   */
  @Patch('items/:productId')
  @UseGuards(OptionalJwtAuthGuard)
  async updateItem(
    @CurrentUser() user: UserDocument | null,
    @Param('productId') productId: string,
    @Body() updateDto: UpdateCartItemDto,
  ) {
    const userId = user ? user._id.toString() : undefined;
    return this.cartService.updateItemQuantity(
      productId,
      updateDto.quantity,
      userId,
      updateDto.sessionId,
    );
  }

  /**
   * Xóa một sản phẩm khỏi giỏ hàng
   * DELETE /api/v1/cart/items/:productId?sessionId=...
   */
  @Delete('items/:productId')
  @UseGuards(OptionalJwtAuthGuard)
  async removeItem(
    @CurrentUser() user: UserDocument | null,
    @Param('productId') productId: string,
    @Query('sessionId') sessionId?: string,
  ) {
    const userId = user ? user._id.toString() : undefined;
    return this.cartService.removeItem(productId, userId, sessionId);
  }

  /**
   * Xóa trắng giỏ hàng
   * DELETE /api/v1/cart?sessionId=...
   */
  @Delete()
  @UseGuards(OptionalJwtAuthGuard)
  async clearCart(
    @CurrentUser() user: UserDocument | null,
    @Query('sessionId') sessionId?: string,
  ) {
    const userId = user ? user._id.toString() : undefined;
    return this.cartService.clearCart(userId, sessionId);
  }

  /**
   * Gộp giỏ hàng khách vãng lai vào tài khoản khi người dùng đăng nhập
   * POST /api/v1/cart/merge
   */
  @Post('merge')
  @UseGuards(JwtAuthGuard)
  async mergeCart(
    @CurrentUser() user: UserDocument,
    @Body() mergeDto: MergeCartDto,
  ) {
    return this.cartService.mergeGuestCart(user._id.toString(), mergeDto.sessionId);
  }
}
