import {
  Controller,
  Post,
  Get,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { AuthService } from './auth.service.js';
import { RegisterDto } from './dto/register.dto.js';
import { LoginDto } from './dto/login.dto.js';
import { JwtAuthGuard } from './guards/jwt-auth.guard.js';
import { RolesGuard } from './guards/roles.guard.js';
import { Roles } from './decorators/roles.decorator.js';
import { CurrentUser } from './decorators/current-user.decorator.js';
import { UserRole } from '../../schemas/user.schema.js';
import type { UserDocument } from '../../schemas/user.schema.js';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  /**
   * Đăng ký tài khoản mới (Customer)
   * POST /api/v1/auth/register
   */
  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  async register(@Body() registerDto: RegisterDto) {
    return this.authService.register(registerDto);
  }

  /**
   * Đăng nhập
   * POST /api/v1/auth/login
   */
  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }

  /**
   * Lấy thông tin tài khoản hiện tại (Protected)
   * GET /api/v1/auth/me
   */
  @Get('me')
  @UseGuards(JwtAuthGuard)
  async getProfile(@CurrentUser() user: UserDocument) {
    return this.authService.getProfile(user._id.toString());
  }

  /**
   * Endpoint kiểm tra quyền Admin (Protected + Role Guard)
   * GET /api/v1/auth/admin-check
   */
  @Get('admin-check')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  async adminCheck(@CurrentUser() user: UserDocument) {
    return {
      message: 'Xác thực Admin thành công! Bạn có toàn quyền truy cập quản trị.',
      admin: {
        id: user._id,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
      },
    };
  }
}
