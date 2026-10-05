import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types, isValidObjectId } from 'mongoose';
import { Cart, CartDocument } from '../../schemas/cart.schema.js';
import { Product, ProductDocument } from '../../schemas/product.schema.js';
import { AddToCartDto } from './dto/add-to-cart.dto.js';

@Injectable()
export class CartService {
  constructor(
    @InjectModel(Cart.name) private readonly cartModel: Model<CartDocument>,
    @InjectModel(Product.name) private readonly productModel: Model<ProductDocument>,
  ) {}

  /**
   * Lấy hoặc khởi tạo giỏ hàng cho User đăng nhập hoặc Guest (qua sessionId)
   */
  async getOrCreateCart(userId?: string, sessionId?: string): Promise<CartDocument> {
    if (!userId && !sessionId) {
      throw new BadRequestException('Yêu cầu thông tin User hoặc Session ID để truy cập giỏ hàng');
    }

    const query: Record<string, any> = {};
    if (userId) {
      query.user = new Types.ObjectId(userId);
    } else {
      query.sessionId = sessionId;
    }

    let cart = await this.cartModel.findOne(query);

    if (!cart) {
      cart = new this.cartModel({
        ...(userId ? { user: new Types.ObjectId(userId) } : { sessionId }),
        items: [],
        totalAmount: 0,
      });
      await cart.save();
    }

    return cart;
  }

  /**
   * Lấy thông tin giỏ hàng chi tiết kèm dữ liệu sản phẩm
   */
  async getCart(userId?: string, sessionId?: string) {
    const cart = await this.getOrCreateCart(userId, sessionId);

    return this.cartModel
      .findById(cart._id)
      .populate('items.product', 'name slug brand images price salePrice stock isActive isDeleted')
      .exec();
  }

  /**
   * Thêm sản phẩm vào giỏ hàng với Price Snapshot
   */
  async addItem(dto: AddToCartDto, userId?: string) {
    if (!isValidObjectId(dto.productId)) {
      throw new BadRequestException('ID sản phẩm không hợp lệ');
    }

    const product = await this.productModel.findOne({
      _id: dto.productId,
      isDeleted: false,
      isActive: true,
    });

    if (!product) {
      throw new NotFoundException('Sản phẩm không tồn tại hoặc đã ngừng kinh doanh');
    }

    const quantityToAdd = dto.quantity ?? 1;
    if (product.stock < quantityToAdd) {
      throw new BadRequestException(`Sản phẩm chỉ còn ${product.stock} trong kho`);
    }

    const cart = await this.getOrCreateCart(userId, dto.sessionId);
    const priceSnapshot = product.salePrice ?? product.price;

    const existingItemIndex = cart.items.findIndex(
      (item) => item.product.toString() === dto.productId,
    );

    if (existingItemIndex > -1) {
      const newQuantity = cart.items[existingItemIndex].quantity + quantityToAdd;
      if (newQuantity > product.stock) {
        throw new BadRequestException(
          `Bạn đã có ${cart.items[existingItemIndex].quantity} trong giỏ. Kho chỉ còn ${product.stock} sản phẩm`,
        );
      }
      cart.items[existingItemIndex].quantity = newQuantity;
      cart.items[existingItemIndex].priceSnapshot = priceSnapshot;
    } else {
      cart.items.push({
        product: new Types.ObjectId(dto.productId),
        quantity: quantityToAdd,
        priceSnapshot,
      } as any);
    }

    this.recalculateTotal(cart);
    await cart.save();

    return this.getCart(userId, dto.sessionId);
  }

  /**
   * Cập nhật số lượng của một sản phẩm trong giỏ hàng
   */
  async updateItemQuantity(
    productId: string,
    quantity: number,
    userId?: string,
    sessionId?: string,
  ) {
    if (!isValidObjectId(productId)) {
      throw new BadRequestException('ID sản phẩm không hợp lệ');
    }

    const cart = await this.getOrCreateCart(userId, sessionId);

    const itemIndex = cart.items.findIndex(
      (item) => item.product.toString() === productId,
    );

    if (itemIndex === -1) {
      throw new NotFoundException('Sản phẩm không có trong giỏ hàng');
    }

    if (quantity <= 0) {
      // Nếu số lượng <= 0 thì tự động xóa khỏi giỏ
      cart.items.splice(itemIndex, 1);
    } else {
      const product = await this.productModel.findOne({
        _id: productId,
        isDeleted: false,
        isActive: true,
      });

      if (!product) {
        throw new NotFoundException('Sản phẩm không còn khả dụng');
      }

      if (quantity > product.stock) {
        throw new BadRequestException(`Số lượng tồn kho chỉ còn ${product.stock}`);
      }

      cart.items[itemIndex].quantity = quantity;
      cart.items[itemIndex].priceSnapshot = product.salePrice ?? product.price;
    }

    this.recalculateTotal(cart);
    await cart.save();

    return this.getCart(userId, sessionId);
  }

  /**
   * Xóa một sản phẩm khỏi giỏ hàng
   */
  async removeItem(productId: string, userId?: string, sessionId?: string) {
    if (!isValidObjectId(productId)) {
      throw new BadRequestException('ID sản phẩm không hợp lệ');
    }

    const cart = await this.getOrCreateCart(userId, sessionId);

    cart.items = cart.items.filter((item) => item.product.toString() !== productId);
    this.recalculateTotal(cart);
    await cart.save();

    return this.getCart(userId, sessionId);
  }

  /**
   * Xóa toàn bộ giỏ hàng
   */
  async clearCart(userId?: string, sessionId?: string) {
    const cart = await this.getOrCreateCart(userId, sessionId);
    cart.items = [];
    cart.totalAmount = 0;
    await cart.save();

    return { message: 'Đã làm trống giỏ hàng thành công', cart };
  }

  /**
   * Gộp giỏ hàng khách vãng lai (Guest Cart) vào giỏ hàng người dùng khi đăng nhập
   */
  async mergeGuestCart(userId: string, sessionId: string) {
    const guestCart = await this.cartModel.findOne({ sessionId });
    if (!guestCart || guestCart.items.length === 0) {
      return this.getCart(userId);
    }

    const userCart = await this.getOrCreateCart(userId);

    for (const guestItem of guestCart.items) {
      const existingItemIndex = userCart.items.findIndex(
        (item) => item.product.toString() === guestItem.product.toString(),
      );

      if (existingItemIndex > -1) {
        userCart.items[existingItemIndex].quantity += guestItem.quantity;
      } else {
        userCart.items.push(guestItem);
      }
    }

    this.recalculateTotal(userCart);
    await userCart.save();

    // Xóa giỏ hàng guest sau khi đã gộp thành công
    await this.cartModel.deleteOne({ _id: guestCart._id });

    return this.getCart(userId);
  }

  /**
   * Tính lại tổng tiền giỏ hàng dựa trên số lượng và priceSnapshot
   */
  private recalculateTotal(cart: CartDocument) {
    cart.totalAmount = cart.items.reduce(
      (sum, item) => sum + item.quantity * item.priceSnapshot,
      0,
    );
  }
}
