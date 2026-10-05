import {
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
  IsArray,
} from 'class-validator';
import { Type } from 'class-transformer';
import { PaymentMethod } from '../../../schemas/order.schema.js';
import { ShippingAddressDto } from './shipping-address.dto.js';

export class OrderItemInputDto {
  @IsNotEmpty({ message: 'ID sản phẩm không được để trống' })
  @IsString({ message: 'ID sản phẩm phải là chuỗi' })
  productId: string;

  @IsNotEmpty({ message: 'Số lượng không được để trống' })
  @IsNumber({}, { message: 'Số lượng phải là số' })
  @Min(1, { message: 'Số lượng tối thiểu là 1' })
  quantity: number;
}

export class CreateOrderDto {
  @IsNotEmpty({ message: 'Địa chỉ nhận hàng không được để trống' })
  @ValidateNested()
  @Type(() => ShippingAddressDto)
  shippingAddress: ShippingAddressDto;

  @IsNotEmpty({ message: 'Phương thức thanh toán không được để trống' })
  @IsEnum(PaymentMethod, {
    message: `Phương thức thanh toán phải là: ${Object.values(PaymentMethod).join(', ')}`,
  })
  paymentMethod: PaymentMethod;

  /**
   * Nếu cung cấp mảng items thì đặt theo danh sách này.
   * Nếu không cung cấp, hệ thống tự động lấy các sản phẩm trong giỏ hàng hiện tại của khách.
   */
  @IsOptional()
  @IsArray({ message: 'Items phải là mảng danh sách' })
  @ValidateNested({ each: true })
  @Type(() => OrderItemInputDto)
  items?: OrderItemInputDto[];

  @IsOptional()
  @IsString({ message: 'Ghi chú phải là chuỗi' })
  customerNote?: string;

  @IsOptional()
  @IsNumber({}, { message: 'Số tiền giảm giá phải là số' })
  @Min(0, { message: 'Số tiền giảm giá không được âm' })
  discountAmount?: number = 0;

  @IsOptional()
  @IsNumber({}, { message: 'Phí vận chuyển phải là số' })
  @Min(0, { message: 'Phí vận chuyển không được âm' })
  shippingFee?: number = 0;
}
