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
import { ProductsService } from './products.service.js';
import { CreateProductDto } from './dto/create-product.dto.js';
import { UpdateProductDto } from './dto/update-product.dto.js';
import { ProductQueryDto } from './dto/product-query.dto.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { RolesGuard } from '../auth/guards/roles.guard.js';
import { Roles } from '../auth/decorators/roles.decorator.js';
import { UserRole } from '../../schemas/user.schema.js';

@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  /**
   * Lấy danh sách sản phẩm với bộ lọc, tìm kiếm, phân trang và sắp xếp (Public)
   * GET /api/v1/products?category=headphones&minPrice=1000000&sort=price:asc&page=1&limit=10
   */
  @Get()
  async findAll(@Query() queryDto: ProductQueryDto) {
    return this.productsService.findAll(queryDto);
  }

  /**
   * Lấy danh sách sản phẩm nổi bật cho trang chủ (Public)
   * GET /api/v1/products/featured?limit=8
   */
  @Get('featured')
  async getFeatured(@Query('limit') limit?: number) {
    const parsedLimit = limit ? Number(limit) : 8;
    return this.productsService.getFeatured(parsedLimit);
  }

  /**
   * Lấy chi tiết sản phẩm theo ID hoặc Slug (Public)
   * GET /api/v1/products/:idOrSlug
   */
  @Get(':idOrSlug')
  async findByIdOrSlug(@Param('idOrSlug') idOrSlug: string) {
    return this.productsService.findByIdOrSlug(idOrSlug);
  }

  /**
   * Tạo sản phẩm mới (Admin)
   * POST /api/v1/products
   */
  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() createProductDto: CreateProductDto) {
    return this.productsService.create(createProductDto);
  }

  /**
   * Cập nhật thông tin sản phẩm (Admin)
   * PATCH /api/v1/products/:id
   */
  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  async update(
    @Param('id') id: string,
    @Body() updateProductDto: UpdateProductDto,
  ) {
    return this.productsService.update(id, updateProductDto);
  }

  /**
   * Xóa mềm sản phẩm (Admin)
   * DELETE /api/v1/products/:id
   */
  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  async remove(@Param('id') id: string) {
    return this.productsService.softDelete(id);
  }
}
