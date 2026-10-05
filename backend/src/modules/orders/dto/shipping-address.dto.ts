import { IsNotEmpty, IsString } from 'class-validator';

export class ShippingAddressDto {
  @IsNotEmpty({ message: 'Tên người nhận không được để trống' })
  @IsString({ message: 'Tên người nhận phải là chuỗi' })
  recipientName: string;

  @IsNotEmpty({ message: 'Số điện thoại không được để trống' })
  @IsString({ message: 'Số điện thoại phải là chuỗi' })
  phone: string;

  @IsNotEmpty({ message: 'Địa chỉ đường/số nhà không được để trống' })
  @IsString({ message: 'Địa chỉ đường phải là chuỗi' })
  street: string;

  @IsNotEmpty({ message: 'Phường/Xã không được để trống' })
  @IsString({ message: 'Phường/Xã phải là chuỗi' })
  ward: string;

  @IsNotEmpty({ message: 'Quận/Huyện không được để trống' })
  @IsString({ message: 'Quận/Huyện phải là chuỗi' })
  district: string;

  @IsNotEmpty({ message: 'Tỉnh/Thành phố không được để trống' })
  @IsString({ message: 'Tỉnh/Thành phố phải là chuỗi' })
  city: string;
}
