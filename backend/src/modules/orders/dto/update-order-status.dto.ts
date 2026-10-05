import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { OrderStatus } from '../../../schemas/order.schema.js';

export class UpdateOrderStatusDto {
  @IsNotEmpty({ message: 'Trạng thái đơn hàng không được để trống' })
  @IsEnum(OrderStatus, {
    message: `Trạng thái phải là một trong các giá trị: ${Object.values(OrderStatus).join(', ')}`,
  })
  status: OrderStatus;

  @IsOptional()
  @IsString({ message: 'Ghi chú admin phải là chuỗi' })
  adminNote?: string;
}
