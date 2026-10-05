import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { PaymentStatus } from '../../../schemas/order.schema.js';

export class UpdatePaymentStatusDto {
  @IsNotEmpty({ message: 'Trạng thái thanh toán không được để trống' })
  @IsEnum(PaymentStatus, {
    message: `Trạng thái thanh toán phải là: ${Object.values(PaymentStatus).join(', ')}`,
  })
  paymentStatus: PaymentStatus;

  @IsOptional()
  @IsString({ message: 'Mã giao dịch phải là chuỗi' })
  transactionId?: string;
}
