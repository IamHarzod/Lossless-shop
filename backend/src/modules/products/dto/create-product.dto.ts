import {
  IsNotEmpty,
  IsOptional,
  IsString,
  IsNumber,
  IsArray,
  IsBoolean,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { AudioSpecsDto } from './audio-specs.dto.js';

export class CreateProductDto {
  @IsNotEmpty({ message: 'Tên sản phẩm không được để trống' })
  @IsString({ message: 'Tên sản phẩm phải là chuỗi ký tự' })
  name: string;

  @IsOptional()
  @IsString({ message: 'Slug phải là chuỗi ký tự' })
  slug?: string;

  @IsNotEmpty({ message: 'Thương hiệu không được để trống' })
  @IsString({ message: 'Thương hiệu phải là chuỗi ký tự' })
  brand: string;

  @IsOptional()
  @IsString({ message: 'Mô tả phải là chuỗi ký tự' })
  description?: string;

  @IsNotEmpty({ message: 'Giá không được để trống' })
  @IsNumber({}, { message: 'Giá phải là số' })
  @Min(0, { message: 'Giá không được âm' })
  price: number;

  @IsOptional()
  @IsNumber({}, { message: 'Giá khuyến mãi phải là số' })
  @Min(0, { message: 'Giá khuyến mãi không được âm' })
  salePrice?: number;

  @IsNotEmpty({ message: 'Danh mục không được để trống' })
  @IsString({ message: 'ID Danh mục phải là chuỗi' })
  category: string;

  @IsOptional()
  @IsArray({ message: 'Danh sách ảnh phải là mảng chuỗi' })
  @IsString({ each: true, message: 'Mỗi đường dẫn ảnh phải là chuỗi' })
  images?: string[];

  @IsOptional()
  @IsNumber({}, { message: 'Số lượng tồn kho phải là số' })
  @Min(0, { message: 'Số lượng tồn kho không được âm' })
  stock?: number;

  @IsOptional()
  @ValidateNested()
  @Type(() => AudioSpecsDto)
  specs?: AudioSpecsDto;

  @IsOptional()
  @IsArray({ message: 'Tags phải là mảng chuỗi' })
  @IsString({ each: true, message: 'Mỗi tag phải là chuỗi' })
  tags?: string[];

  @IsOptional()
  @IsBoolean({ message: 'isFeatured phải là boolean' })
  isFeatured?: boolean;

  @IsOptional()
  @IsBoolean({ message: 'isActive phải là boolean' })
  isActive?: boolean;
}
