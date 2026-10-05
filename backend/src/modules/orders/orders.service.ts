import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types, isValidObjectId } from 'mongoose';
import {
  Order,
  OrderDocument,
  OrderStatus,
  PaymentStatus,
  OrderItem,
} from '../../schemas/order.schema.js';
import { Product, ProductDocument } from '../../schemas/product.schema.js';
import { Cart, CartDocument } from '../../schemas/cart.schema.js';
import { CreateOrderDto } from './dto/create-order.dto.js';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto.js';
import { UpdatePaymentStatusDto } from './dto/update-payment-status.dto.js';
import { OrderQueryDto } from './dto/order-query.dto.js';

@Injectable()
export class OrdersService {
  constructor(
    @InjectModel(Order.name) private readonly orderModel: Model<OrderDocument>,
    @InjectModel(Product.name) private readonly productModel: Model<ProductDocument>,
    @InjectModel(Cart.name) private readonly cartModel: Model<CartDocument>,
  ) {}

  /**
   * Tạo mã đơn hàng duy nhất dạng LS-YYYYMMDD-XXXX (ví dụ: LS-20261005-A1B2)
   */
  private async generateOrderCode(): Promise<string> {
    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    let orderCode = '';
    let isUnique = false;

    while (!isUnique) {
      const randomSuffix = Math.random().toString(36).substring(2, 6).toUpperCase();
      orderCode = `LS-${dateStr}-${randomSuffix}`;
      const existing = await this.orderModel.findOne({ orderCode });
      if (!existing) {
        isUnique = true;
      }
    }

    return orderCode;
  }

  /**
   * Đặt hàng mới (Customer)
   * Tự động trừ tồn kho và snapshot toàn bộ giá & thông tin sản phẩm
   */
  async createOrder(userId: string, createDto: CreateOrderDto): Promise<OrderDocument> {
    let itemsToProcess = createDto.items;
    let orderedFromCart = false;

    // Nếu không truyền danh sách items cụ thể, lấy từ giỏ hàng hiện tại của khách
    if (!itemsToProcess || itemsToProcess.length === 0) {
      const userCart = await this.cartModel.findOne({ user: new Types.ObjectId(userId) });
      if (!userCart || userCart.items.length === 0) {
        throw new BadRequestException(
          'Giỏ hàng của bạn đang trống, vui lòng thêm sản phẩm trước khi thanh toán',
        );
      }
      itemsToProcess = userCart.items.map((item) => ({
        productId: item.product.toString(),
        quantity: item.quantity,
      }));
      orderedFromCart = true;
    }

    const orderItems: OrderItem[] = [];
    const productsToUpdate: { product: ProductDocument; newStock: number }[] = [];

    // 1. Kiểm tra từng sản phẩm & số lượng tồn kho
    for (const itemInput of itemsToProcess) {
      if (!isValidObjectId(itemInput.productId)) {
        throw new BadRequestException(`ID sản phẩm "${itemInput.productId}" không hợp lệ`);
      }

      const product = await this.productModel.findOne({
        _id: itemInput.productId,
        isDeleted: false,
        isActive: true,
      });

      if (!product) {
        throw new NotFoundException(
          `Sản phẩm ID "${itemInput.productId}" không tồn tại hoặc đã ngừng kinh doanh`,
        );
      }

      if (product.stock < itemInput.quantity) {
        throw new BadRequestException(
          `Sản phẩm "${product.name}" chỉ còn ${product.stock} trong kho, không đủ đáp ứng số lượng ${itemInput.quantity}`,
        );
      }

      const unitPrice = product.salePrice ?? product.price;
      const subtotal = unitPrice * itemInput.quantity;

      orderItems.push({
        product: product._id as any,
        productName: product.name,
        productImage: product.images?.[0] || '',
        quantity: itemInput.quantity,
        unitPrice,
        subtotal,
      });

      productsToUpdate.push({
        product,
        newStock: product.stock - itemInput.quantity,
      });
    }

    // 2. Trừ tồn kho các sản phẩm
    for (const item of productsToUpdate) {
      item.product.stock = item.newStock;
      await item.product.save();
    }

    // 3. Tính toán các khoản tiền
    const subtotal = orderItems.reduce((sum, item) => sum + item.subtotal, 0);
    const shippingFee = createDto.shippingFee ?? 0;
    const discountAmount = createDto.discountAmount ?? 0;
    const totalAmount = Math.max(0, subtotal + shippingFee - discountAmount);

    // 4. Khởi tạo đơn hàng với snapshot đầy đủ
    const orderCode = await this.generateOrderCode();
    const newOrder = new this.orderModel({
      orderCode,
      user: new Types.ObjectId(userId),
      items: orderItems,
      shippingAddress: createDto.shippingAddress,
      subtotal,
      shippingFee,
      discountAmount,
      totalAmount,
      status: OrderStatus.PENDING,
      paymentMethod: createDto.paymentMethod,
      paymentStatus: PaymentStatus.PENDING,
      customerNote: createDto.customerNote,
      isDeleted: false,
    });

    const savedOrder = await newOrder.save();

    // 5. Nếu đặt hàng từ giỏ hàng, xóa sạch giỏ hàng của khách
    if (orderedFromCart) {
      await this.cartModel.updateOne(
        { user: new Types.ObjectId(userId) },
        { items: [], totalAmount: 0 },
      );
    }

    return savedOrder.populate('user', 'fullName email phone');
  }

  /**
   * Lấy lịch sử đơn hàng của chính khách hàng hiện tại
   */
  async getMyOrders(userId: string, query: OrderQueryDto) {
    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.min(50, Math.max(1, Number(query.limit) || 10));
    const skip = (page - 1) * limit;

    const filter: Record<string, any> = {
      user: new Types.ObjectId(userId),
      isDeleted: false,
    };

    if (query.status) filter.status = query.status;
    if (query.paymentStatus) filter.paymentStatus = query.paymentStatus;

    const [total, orders] = await Promise.all([
      this.orderModel.countDocuments(filter),
      this.orderModel.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).exec(),
    ]);

    const totalPages = Math.ceil(total / limit) || 1;

    return {
      data: orders,
      meta: {
        total,
        page,
        limit,
        totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      },
    };
  }

  /**
   * Lấy chi tiết đơn hàng theo mã đơn hàng hoặc ID
   * Khách chỉ xem được đơn của mình, Admin xem được tất cả
   */
  async getOrderDetails(orderCodeOrId: string, userId?: string, isAdmin = false) {
    const isId = isValidObjectId(orderCodeOrId);
    const query = isId ? { _id: orderCodeOrId } : { orderCode: orderCodeOrId.toUpperCase() };

    const order = await this.orderModel
      .findOne({ ...query, isDeleted: false })
      .populate('user', 'fullName email phone')
      .exec();

    if (!order) {
      throw new NotFoundException(`Không tìm thấy đơn hàng "${orderCodeOrId}"`);
    }

    if (!isAdmin && order.user && (order.user as any)._id?.toString() !== userId && order.user.toString() !== userId) {
      throw new ForbiddenException('Bạn không có quyền truy cập thông tin đơn hàng này');
    }

    return order;
  }

  /**
   * Hủy đơn hàng (Khách hàng hủy khi đơn còn Pending, hoặc Admin hủy)
   * Tự động hoàn trả số lượng tồn kho (restock)
   */
  async cancelOrder(
    orderCodeOrId: string,
    userId?: string,
    isAdmin = false,
    reason?: string,
  ) {
    const order = await this.getOrderDetails(orderCodeOrId, userId, isAdmin);

    if (order.status === OrderStatus.CANCELLED) {
      throw new BadRequestException('Đơn hàng này đã được hủy trước đó');
    }

    if (order.status === OrderStatus.DELIVERED) {
      throw new BadRequestException('Đơn hàng đã giao thành công, không thể hủy');
    }

    if (!isAdmin && order.status !== OrderStatus.PENDING) {
      throw new BadRequestException(
        'Khách hàng chỉ có thể hủy đơn khi đơn hàng đang ở trạng thái Chờ xử lý (Pending)',
      );
    }

    // Hoàn trả lại tồn kho cho từng sản phẩm trong đơn
    for (const item of order.items) {
      await this.productModel.updateOne(
        { _id: item.product },
        { $inc: { stock: item.quantity } },
      );
    }

    order.status = OrderStatus.CANCELLED;
    if (reason) {
      order.adminNote = order.adminNote
        ? `${order.adminNote} | Lý do hủy: ${reason}`
        : `Lý do hủy: ${reason}`;
    }

    await order.save();
    return {
      message: `Đã hủy đơn hàng ${order.orderCode} và hoàn trả số lượng tồn kho thành công`,
      order,
    };
  }

  /**
   * Quản lý đơn hàng (Admin): Xem toàn bộ danh sách kèm tìm kiếm & lọc
   */
  async getAllOrders(query: OrderQueryDto) {
    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.min(50, Math.max(1, Number(query.limit) || 10));
    const skip = (page - 1) * limit;

    const filter: Record<string, any> = { isDeleted: false };

    if (query.status) filter.status = query.status;
    if (query.paymentStatus) filter.paymentStatus = query.paymentStatus;

    if (query.search && query.search.trim()) {
      const searchRegex = new RegExp(query.search.trim(), 'i');
      filter.$or = [
        { orderCode: searchRegex },
        { 'shippingAddress.recipientName': searchRegex },
        { 'shippingAddress.phone': searchRegex },
      ];
    }

    const [total, orders] = await Promise.all([
      this.orderModel.countDocuments(filter),
      this.orderModel
        .find(filter)
        .populate('user', 'fullName email phone')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .exec(),
    ]);

    const totalPages = Math.ceil(total / limit) || 1;

    return {
      data: orders,
      meta: {
        total,
        page,
        limit,
        totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      },
    };
  }

  /**
   * Cập nhật trạng thái đơn hàng (Admin)
   */
  async updateOrderStatus(id: string, updateDto: UpdateOrderStatusDto) {
    if (!isValidObjectId(id)) {
      throw new BadRequestException('ID đơn hàng không hợp lệ');
    }

    const order = await this.orderModel.findOne({ _id: id, isDeleted: false });
    if (!order) {
      throw new NotFoundException('Không tìm thấy đơn hàng');
    }

    // Nếu chuyển sang CANCELLED, hoàn trả tồn kho
    if (updateDto.status === OrderStatus.CANCELLED && order.status !== OrderStatus.CANCELLED) {
      for (const item of order.items) {
        await this.productModel.updateOne(
          { _id: item.product },
          { $inc: { stock: item.quantity } },
        );
      }
    }

    order.status = updateDto.status;
    if (updateDto.adminNote) {
      order.adminNote = updateDto.adminNote;
    }

    // Nếu đơn hàng COD được giao thành công -> tự động cập nhật thanh toán là PAID
    if (
      updateDto.status === OrderStatus.DELIVERED &&
      order.paymentMethod === 'cod' &&
      order.paymentStatus !== PaymentStatus.PAID
    ) {
      order.paymentStatus = PaymentStatus.PAID;
    }

    await order.save();
    return order.populate('user', 'fullName email phone');
  }

  /**
   * Cập nhật trạng thái thanh toán (Admin / Payment Webhook)
   */
  async updatePaymentStatus(id: string, updateDto: UpdatePaymentStatusDto) {
    if (!isValidObjectId(id)) {
      throw new BadRequestException('ID đơn hàng không hợp lệ');
    }

    const order = await this.orderModel.findOne({ _id: id, isDeleted: false });
    if (!order) {
      throw new NotFoundException('Không tìm thấy đơn hàng');
    }

    order.paymentStatus = updateDto.paymentStatus;
    if (updateDto.transactionId) {
      order.transactionId = updateDto.transactionId;
    }

    // Nếu đã thanh toán thành công và đơn đang Pending -> chuyển sang Processing
    if (
      updateDto.paymentStatus === PaymentStatus.PAID &&
      order.status === OrderStatus.PENDING
    ) {
      order.status = OrderStatus.PROCESSING;
    }

    await order.save();
    return order.populate('user', 'fullName email phone');
  }
}
