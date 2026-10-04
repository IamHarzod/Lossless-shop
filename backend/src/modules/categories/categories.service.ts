import {
  Injectable,
  ConflictException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, isValidObjectId } from 'mongoose';
import { Category, CategoryDocument } from '../../schemas/category.schema.js';
import { CreateCategoryDto } from './dto/create-category.dto.js';
import { UpdateCategoryDto } from './dto/update-category.dto.js';
import { slugify } from '../../common/utils/slugify.util.js';

@Injectable()
export class CategoriesService {
  constructor(
    @InjectModel(Category.name)
    private readonly categoryModel: Model<CategoryDocument>,
  ) {}

  /**
   * Tạo danh mục mới (Admin)
   */
  async create(createDto: CreateCategoryDto): Promise<CategoryDocument> {
    const slug = createDto.slug ? slugify(createDto.slug) : slugify(createDto.name);

    // Kiểm tra tên hoặc slug trùng lặp
    const existing = await this.categoryModel.findOne({
      $or: [{ name: createDto.name.trim() }, { slug }],
      isDeleted: false,
    });

    if (existing) {
      throw new ConflictException('Tên danh mục hoặc slug đã tồn tại');
    }

    const createdCategory = new this.categoryModel({
      ...createDto,
      name: createDto.name.trim(),
      slug,
      isActive: createDto.isActive ?? true,
      isDeleted: false,
    });

    return createdCategory.save();
  }

  /**
   * Lấy danh sách danh mục (Public: chỉ active; Admin: xem hết)
   */
  async findAll(onlyActive = true): Promise<CategoryDocument[]> {
    const filter: Record<string, any> = { isDeleted: false };
    if (onlyActive) {
      filter.isActive = true;
    }
    return this.categoryModel.find(filter).sort({ name: 1 }).exec();
  }

  /**
   * Lấy chi tiết danh mục theo slug
   */
  async findBySlug(slug: string): Promise<CategoryDocument> {
    const category = await this.categoryModel
      .findOne({ slug: slug.toLowerCase(), isDeleted: false })
      .exec();

    if (!category) {
      throw new NotFoundException(`Không tìm thấy danh mục với slug: "${slug}"`);
    }

    return category;
  }

  /**
   * Lấy chi tiết danh mục theo ID
   */
  async findById(id: string): Promise<CategoryDocument> {
    if (!isValidObjectId(id)) {
      throw new BadRequestException('ID danh mục không hợp lệ');
    }

    const category = await this.categoryModel
      .findOne({ _id: id, isDeleted: false })
      .exec();

    if (!category) {
      throw new NotFoundException('Không tìm thấy danh mục');
    }

    return category;
  }

  /**
   * Cập nhật danh mục (Admin)
   */
  async update(id: string, updateDto: UpdateCategoryDto): Promise<CategoryDocument> {
    const category = await this.findById(id);

    // Nếu có đổi tên hoặc đổi slug, kiểm tra trùng lặp
    if (updateDto.name || updateDto.slug) {
      const newSlug = updateDto.slug
        ? slugify(updateDto.slug)
        : updateDto.name
          ? slugify(updateDto.name)
          : category.slug;

      const existing = await this.categoryModel.findOne({
        _id: { $ne: id },
        $or: [
          ...(updateDto.name ? [{ name: updateDto.name.trim() }] : []),
          { slug: newSlug },
        ],
        isDeleted: false,
      });

      if (existing) {
        throw new ConflictException('Tên danh mục hoặc slug đã được sử dụng');
      }

      if (updateDto.name) category.name = updateDto.name.trim();
      category.slug = newSlug;
    }

    if (updateDto.description !== undefined) category.description = updateDto.description;
    if (updateDto.imageUrl !== undefined) category.imageUrl = updateDto.imageUrl;
    if (updateDto.isActive !== undefined) category.isActive = updateDto.isActive;

    return category.save();
  }

  /**
   * Xóa mềm danh mục (Admin)
   */
  async softDelete(id: string): Promise<{ message: string }> {
    const category = await this.findById(id);
    category.isDeleted = true;
    category.isActive = false;
    await category.save();

    return { message: `Đã xóa mềm danh mục "${category.name}" thành công` };
  }
}
