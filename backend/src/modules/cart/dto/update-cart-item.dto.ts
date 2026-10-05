import { IsNotEmpty, IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class UpdateCartItemDto {
  @IsNotEmpty({ message: 'Số lượng không được để trống' })
  @IsNumber({}, { message: 'Số lượng phải là số' })
  @Min(0, { message: 'Số lượng không được âm (0 để xóa sản phẩm)' })
  quantity: number;

  @IsOptional()
  @IsString({ message: 'Session ID phải là chuỗi' })
  sessionId?: string;
}
