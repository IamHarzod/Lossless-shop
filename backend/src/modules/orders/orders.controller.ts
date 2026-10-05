import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { OrdersService } from './orders.service.js';
import { CreateOrderDto } from './dto/create-order.dto.js';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto.js';
import { UpdatePaymentStatusDto } from './dto/update-payment-status.dto.js';
import { OrderQueryDto } from './dto/order-query.dto.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { RolesGuard } from '../auth/guards/roles.guard.js';
import { Roles } from '../auth/decorators/roles.decorator.js';
import { CurrentUser } from '../auth/decorators/current-user.decorator.js';
import { UserRole } from '../../schemas/user.schema.js';
import type { UserDocument } from '../../schemas/user.schema.js';

@Controller('orders')
@UseGuards(JwtAuthGuard)
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  /**
   * Đặt hàng mới (Customer)
   * POST /api/v1/orders
   */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(
    @CurrentUser() user: UserDocument,
    @Body() createOrderDto: CreateOrderDto,
  ) {
    return this.ordersService.createOrder(user._id.toString(), createOrderDto);
  }

  /**
   * Xem lịch sử đơn hàng của bản thân (Customer)
   * GET /api/v1/orders/my-orders
   */
  @Get('my-orders')
  async getMyOrders(
    @CurrentUser() user: UserDocument,
    @Query() query: OrderQueryDto,
  ) {
    return this.ordersService.getMyOrders(user._id.toString(), query);
  }

  /**
   * Quản lý toàn bộ danh sách đơn hàng (Admin)
   * GET /api/v1/orders
   */
  @Get()
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  async getAllOrders(@Query() query: OrderQueryDto) {
    return this.ordersService.getAllOrders(query);
  }

  /**
   * Xem chi tiết một đơn hàng theo Mã đơn hàng hoặc ID
   * GET /api/v1/orders/:orderCodeOrId
   */
  @Get(':orderCodeOrId')
  async getOrderDetails(
    @CurrentUser() user: UserDocument,
    @Param('orderCodeOrId') orderCodeOrId: string,
  ) {
    const isAdmin = user.role === UserRole.ADMIN;
    return this.ordersService.getOrderDetails(
      orderCodeOrId,
      user._id.toString(),
      isAdmin,
    );
  }

  /**
   * Hủy đơn hàng (Khách hủy đơn Pending hoặc Admin hủy)
   * PATCH /api/v1/orders/:orderCodeOrId/cancel
   */
  @Patch(':orderCodeOrId/cancel')
  async cancelOrder(
    @CurrentUser() user: UserDocument,
    @Param('orderCodeOrId') orderCodeOrId: string,
    @Body('reason') reason?: string,
  ) {
    const isAdmin = user.role === UserRole.ADMIN;
    return this.ordersService.cancelOrder(
      orderCodeOrId,
      user._id.toString(),
      isAdmin,
      reason,
    );
  }

  /**
   * Cập nhật trạng thái đơn hàng (Admin)
   * PATCH /api/v1/orders/:id/status
   */
  @Patch(':id/status')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  async updateStatus(
    @Param('id') id: string,
    @Body() updateDto: UpdateOrderStatusDto,
  ) {
    return this.ordersService.updateOrderStatus(id, updateDto);
  }

  /**
   * Cập nhật trạng thái thanh toán (Admin)
   * PATCH /api/v1/orders/:id/payment-status
   */
  @Patch(':id/payment-status')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  async updatePayment(
    @Param('id') id: string,
    @Body() updateDto: UpdatePaymentStatusDto,
  ) {
    return this.ordersService.updatePaymentStatus(id, updateDto);
  }
}
