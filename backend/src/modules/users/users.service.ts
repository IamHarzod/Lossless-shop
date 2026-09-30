import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import bcrypt from 'bcrypt';
import { ConfigService } from '@nestjs/config';
import { User, UserDocument } from '../../schemas/user.schema.js';

@Injectable()
export class UsersService {
  constructor(
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
    private readonly configService: ConfigService,
  ) {}

  /**
   * Tạo người dùng mới với mật khẩu được mã hóa bcrypt
   */
  async create(userData: Partial<User>): Promise<UserDocument> {
    const saltRounds = Number(this.configService.get<number>('BCRYPT_SALT_ROUNDS')) || 10;
    const hashedPassword = await bcrypt.hash(userData.password!, saltRounds);

    const createdUser = new this.userModel({
      ...userData,
      password: hashedPassword,
    });

    return createdUser.save();
  }

  /**
   * Tìm người dùng theo email (chỉ tìm tài khoản chưa bị xóa mềm)
   * @param includePassword nếu true sẽ lấy cả trường password (do schema để select: false)
   */
  async findByEmail(email: string, includePassword = false): Promise<UserDocument | null> {
    const query = this.userModel.findOne({
      email: email.toLowerCase().trim(),
      isDeleted: false,
    });

    if (includePassword) {
      query.select('+password');
    }

    return query.exec();
  }

  /**
   * Tìm người dùng theo ID (chỉ tìm tài khoản chưa bị xóa mềm)
   */
  async findById(id: string): Promise<UserDocument | null> {
    return this.userModel.findOne({ _id: id, isDeleted: false }).exec();
  }

  /**
   * Cập nhật thông tin người dùng
   */
  async update(id: string, updateData: Partial<User>): Promise<UserDocument> {
    if (updateData.password) {
      const saltRounds = Number(this.configService.get<number>('BCRYPT_SALT_ROUNDS')) || 10;
      updateData.password = await bcrypt.hash(updateData.password, saltRounds);
    }

    const updatedUser = await this.userModel
      .findOneAndUpdate({ _id: id, isDeleted: false }, updateData, { new: true })
      .exec();

    if (!updatedUser) {
      throw new NotFoundException('Không tìm thấy người dùng');
    }

    return updatedUser;
  }
}
