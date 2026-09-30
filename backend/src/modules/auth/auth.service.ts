import {
  Injectable,
  ConflictException,
  UnauthorizedException,
  NotFoundException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import bcrypt from 'bcrypt';
import { UsersService } from '../users/users.service.js';
import { UserDocument, UserRole } from '../../schemas/user.schema.js';
import { RegisterDto } from './dto/register.dto.js';
import { LoginDto } from './dto/login.dto.js';
import { JwtPayload } from './strategies/jwt.strategy.js';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
  ) {}

  /**
   * Đăng ký tài khoản khách hàng mới
   */
  async register(registerDto: RegisterDto) {
    const existingUser = await this.usersService.findByEmail(registerDto.email);
    if (existingUser) {
      throw new ConflictException('Email này đã được sử dụng');
    }

    // Luôn gán role mặc định là CUSTOMER để bảo mật
    const newUser = await this.usersService.create({
      ...registerDto,
      role: UserRole.CUSTOMER,
      isActive: true,
      isDeleted: false,
    });

    const accessToken = this.generateToken(newUser);

    return {
      message: 'Đăng ký tài khoản thành công',
      accessToken,
      user: this.sanitizeUser(newUser),
    };
  }

  /**
   * Đăng nhập người dùng bằng email và mật khẩu
   */
  async login(loginDto: LoginDto) {
    const user = await this.usersService.findByEmail(loginDto.email, true);

    if (!user) {
      throw new UnauthorizedException('Email hoặc mật khẩu không chính xác');
    }

    if (!user.isActive) {
      throw new UnauthorizedException('Tài khoản đã bị tạm khóa, vui lòng liên hệ quản trị viên');
    }

    const isPasswordValid = await bcrypt.compare(loginDto.password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Email hoặc mật khẩu không chính xác');
    }

    const accessToken = this.generateToken(user);

    return {
      message: 'Đăng nhập thành công',
      accessToken,
      user: this.sanitizeUser(user),
    };
  }

  /**
   * Lấy thông tin tài khoản hiện tại từ ID
   */
  async getProfile(userId: string) {
    const user = await this.usersService.findById(userId);
    if (!user) {
      throw new NotFoundException('Không tìm thấy thông tin người dùng');
    }
    return this.sanitizeUser(user);
  }

  /**
   * Tạo JWT Token từ thông tin người dùng
   */
  private generateToken(user: UserDocument): string {
    const payload: JwtPayload = {
      sub: user._id.toString(),
      email: user.email,
      role: user.role,
    };
    return this.jwtService.sign(payload);
  }

  /**
   * Lọc bỏ các trường nhạy cảm như password trước khi trả về client
   */
  private sanitizeUser(user: UserDocument) {
    const userObj = user.toObject ? user.toObject() : { ...user };
    delete userObj.password;
    return userObj;
  }
}
