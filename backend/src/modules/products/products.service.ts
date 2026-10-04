import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, isValidObjectId, Types } from 'mongoose';
import { Product, ProductDocument } from '../../schemas/product.schema.js';
import { Category, CategoryDocument } from '../../schemas/category.schema.js';
import { CreateProductDto } from './dto/create-product.dto.js';
import { UpdateProductDto } from './dto/update-product.dto.js';
import { ProductQueryDto } from './dto/product-query.dto.js';
import { slugify } from '../../common/utils/slugify.util.js';

@Injectable()
export class ProductsService {
  constructor(
    @InjectModel(Product.name)
    private readonly productModel: Model<ProductDocument>,
    @InjectModel(Category.name)
    private readonly categoryModel: Model<CategoryDocument>,
  ) {}

  /**
   * Tạo sản phẩm mới (Admin)
   */
  async create(createDto: CreateProductDto): Promise<ProductDocument> {
    // 1. Kiểm tra danh mục hợp lệ
    if (!isValidObjectId(createDto.category)) {
      throw new BadRequestException('ID Danh mục không hợp lệ');
    }

    const categoryExists = await this.categoryModel.findOne({
      _id: createDto.category,
      isDeleted: false,
    });
    if (!categoryExists) {
      throw new NotFoundException('Không tìm thấy danh mục được chỉ định');
    }

    // 2. Tạo slug tự động nếu không cung cấp
    const slug = createDto.slug ? slugify(createDto.slug) : slugify(createDto.name);

    // 3. Kiểm tra trùng slug
    const existing = await this.productModel.findOne({ slug, isDeleted: false });
    if (existing) {
      throw new ConflictException(`Sản phẩm với slug "${slug}" đã tồn tại`);
    }

    // 4. Lưu sản phẩm
    const newProduct = new this.productModel({
      ...createDto,
      name: createDto.name.trim(),
      slug,
      brand: createDto.brand.trim(),
      category: new Types.ObjectId(createDto.category),
      images: createDto.images || [],
      tags: createDto.tags || [],
      stock: createDto.stock ?? 0,
      isFeatured: createDto.isFeatured ?? false,
      isActive: createDto.isActive ?? true,
      isDeleted: false,
    });

    return (await newProduct.save()).populate('category', 'name slug description imageUrl');
  }

  /**
   * Lấy danh sách sản phẩm với bộ lọc chuyên sâu Audiophile, tìm kiếm, phân trang và sắp xếp
   */
  async findAll(query: ProductQueryDto) {
    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.min(50, Math.max(1, Number(query.limit) || 10));
    const skip = (page - 1) * limit;

    const filter: Record<string, any> = {
      isDeleted: false,
      isActive: true,
    };

    // 1. Lọc theo danh mục (ID hoặc slug)
    if (query.category) {
      if (isValidObjectId(query.category)) {
        filter.category = new Types.ObjectId(query.category);
      } else {
        const cat = await this.categoryModel.findOne({
          slug: query.category.toLowerCase().trim(),
          isDeleted: false,
        });
        if (cat) {
          filter.category = cat._id;
        } else {
          // Nếu danh mục không tồn tại -> trả về rỗng ngay
          return {
            data: [],
            meta: { total: 0, page, limit, totalPages: 0, hasNextPage: false, hasPrevPage: false },
          };
        }
      }
    }

    // 2. Lọc theo thương hiệu (hỗ trợ tìm kiếm gần đúng case-insensitive)
    if (query.brand) {
      filter.brand = { $regex: new RegExp(query.brand.trim(), 'i') };
    }

    // 3. Lọc theo khoảng giá
    if (query.minPrice !== undefined || query.maxPrice !== undefined) {
      filter.price = {};
      if (query.minPrice !== undefined) filter.price.$gte = Number(query.minPrice);
      if (query.maxPrice !== undefined) filter.price.$lte = Number(query.maxPrice);
    }

    // 4. Lọc theo đánh giá tối thiểu
    if (query.minRating !== undefined) {
      filter.rating = { $gte: Number(query.minRating) };
    }

    // 5. Lọc sản phẩm nổi bật
    if (query.isFeatured !== undefined) {
      filter.isFeatured = query.isFeatured;
    }

    // 6. Lọc sản phẩm còn hàng
    if (query.inStock) {
      filter.stock = { $gt: 0 };
    }

    // 7. Lọc theo thông số kỹ thuật Audiophile (Audiophile Specs)
    if (query.driverType) {
      filter['specs.driverType'] = { $regex: new RegExp(query.driverType.trim(), 'i') };
    }
    if (query.connector) {
      filter['specs.connector'] = { $regex: new RegExp(query.connector.trim(), 'i') };
    }
    if (query.dacChip) {
      filter['specs.dacChip'] = { $regex: new RegExp(query.dacChip.trim(), 'i') };
    }

    // 8. Tìm kiếm từ khóa (tên, hãng, tags)
    if (query.search && query.search.trim()) {
      const searchRegex = new RegExp(query.search.trim(), 'i');
      filter.$or = [
        { name: { $regex: searchRegex } },
        { brand: { $regex: searchRegex } },
        { tags: { $in: [searchRegex] } },
      ];
    }

    // 9. Sắp xếp (Sorting)
    const sortOption: Record<string, 1 | -1> = {};
    switch (query.sort) {
      case 'price:asc':
        sortOption.price = 1;
        break;
      case 'price:desc':
        sortOption.price = -1;
        break;
      case 'rating':
        sortOption.rating = -1;
        break;
      case 'popular':
        sortOption.reviewCount = -1;
        break;
      case 'newest':
      default:
        sortOption.createdAt = -1;
        break;
    }

    // 10. Truy vấn và đếm tổng
    const [total, products] = await Promise.all([
      this.productModel.countDocuments(filter),
      this.productModel
        .find(filter)
        .populate('category', 'name slug imageUrl')
        .sort(sortOption)
        .skip(skip)
        .limit(limit)
        .exec(),
    ]);

    const totalPages = Math.ceil(total / limit) || 1;

    return {
      data: products,
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
   * Lấy chi tiết sản phẩm theo ID hoặc Slug (Public)
   */
  async findByIdOrSlug(idOrSlug: string): Promise<ProductDocument> {
    const isId = isValidObjectId(idOrSlug);
    const query = isId
      ? { _id: idOrSlug, isDeleted: false }
      : { slug: idOrSlug.toLowerCase(), isDeleted: false };

    const product = await this.productModel
      .findOne(query)
      .populate('category', 'name slug description imageUrl')
      .exec();

    if (!product) {
      throw new NotFoundException(`Không tìm thấy sản phẩm với định danh: "${idOrSlug}"`);
    }

    return product;
  }

  /**
   * Lấy danh sách sản phẩm nổi bật (Featured) cho trang chủ
   */
  async getFeatured(limit = 8): Promise<ProductDocument[]> {
    return this.productModel
      .find({ isFeatured: true, isActive: true, isDeleted: false })
      .populate('category', 'name slug imageUrl')
      .sort({ rating: -1, createdAt: -1 })
      .limit(limit)
      .exec();
  }

  /**
   * Cập nhật thông tin sản phẩm (Admin)
   */
  async update(id: string, updateDto: UpdateProductDto): Promise<ProductDocument> {
    if (!isValidObjectId(id)) {
      throw new BadRequestException('ID sản phẩm không hợp lệ');
    }

    const product = await this.productModel.findOne({ _id: id, isDeleted: false });
    if (!product) {
      throw new NotFoundException('Không tìm thấy sản phẩm');
    }

    // Kiểm tra danh mục mới nếu có cập nhật
    if (updateDto.category) {
      if (!isValidObjectId(updateDto.category)) {
        throw new BadRequestException('ID Danh mục không hợp lệ');
      }
      const categoryExists = await this.categoryModel.findOne({
        _id: updateDto.category,
        isDeleted: false,
      });
      if (!categoryExists) {
        throw new NotFoundException('Không tìm thấy danh mục');
      }
      product.category = new Types.ObjectId(updateDto.category);
    }

    // Kiểm tra slug mới nếu có thay đổi
    if (updateDto.slug || updateDto.name) {
      const newSlug = updateDto.slug
        ? slugify(updateDto.slug)
        : updateDto.name
          ? slugify(updateDto.name)
          : product.slug;

      const existing = await this.productModel.findOne({
        _id: { $ne: id },
        slug: newSlug,
        isDeleted: false,
      });

      if (existing) {
        throw new ConflictException(`Slug "${newSlug}" đã được sử dụng bởi sản phẩm khác`);
      }

      product.slug = newSlug;
      if (updateDto.name) product.name = updateDto.name.trim();
    }

    if (updateDto.brand) product.brand = updateDto.brand.trim();
    if (updateDto.description !== undefined) product.description = updateDto.description;
    if (updateDto.price !== undefined) product.price = updateDto.price;
    if (updateDto.salePrice !== undefined) product.salePrice = updateDto.salePrice;
    if (updateDto.images !== undefined) product.images = updateDto.images;
    if (updateDto.stock !== undefined) product.stock = updateDto.stock;
    if (updateDto.specs !== undefined) product.specs = updateDto.specs as any;
    if (updateDto.tags !== undefined) product.tags = updateDto.tags;
    if (updateDto.isFeatured !== undefined) product.isFeatured = updateDto.isFeatured;
    if (updateDto.isActive !== undefined) product.isActive = updateDto.isActive;

    await product.save();
    return product.populate('category', 'name slug description imageUrl');
  }

  /**
   * Xóa mềm sản phẩm (Admin)
   */
  async softDelete(id: string): Promise<{ message: string }> {
    if (!isValidObjectId(id)) {
      throw new BadRequestException('ID sản phẩm không hợp lệ');
    }

    const product = await this.productModel.findOne({ _id: id, isDeleted: false });
    if (!product) {
      throw new NotFoundException('Không tìm thấy sản phẩm');
    }

    product.isDeleted = true;
    product.isActive = false;
    await product.save();

    return { message: `Đã xóa mềm sản phẩm "${product.name}" thành công` };
  }
}
