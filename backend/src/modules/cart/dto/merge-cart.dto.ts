import { IsNotEmpty, IsString } from 'class-validator';

export class MergeCartDto {
  @IsNotEmpty({ message: 'Session ID không được để trống' })
  @IsString({ message: 'Session ID phải là chuỗi' })
  sessionId: string;
}
