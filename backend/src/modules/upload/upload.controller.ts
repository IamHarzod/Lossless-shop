import {
  Controller,
  Post,
  UseInterceptors,
  UploadedFile,
  UploadedFiles,
  UseGuards,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import { existsSync, mkdirSync } from 'fs';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { RolesGuard } from '../auth/guards/roles.guard.js';
import { Roles } from '../auth/decorators/roles.decorator.js';
import { UserRole } from '../../schemas/user.schema.js';
import { UploadService } from './upload.service.js';

const uploadDir = join(process.cwd(), 'uploads', 'products');
if (!existsSync(uploadDir)) {
  mkdirSync(uploadDir, { recursive: true });
}

const multerOptions = {
  storage: diskStorage({
    destination: (_req, _file, cb) => {
      cb(null, uploadDir);
    },
    filename: (_req, file, cb) => {
      const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
      const ext = extname(file.originalname).toLowerCase();
      cb(null, `product-${uniqueSuffix}${ext}`);
    },
  }),
  fileFilter: (_req: any, file: any, cb: any) => {
    const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (allowedMimeTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(
        new BadRequestException(
          'Chỉ hỗ trợ file ảnh định dạng JPG, JPEG, PNG, WEBP hoặc GIF',
        ),
        false,
      );
    }
  },
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
  },
};

@Controller('upload')
export class UploadController {
  constructor(private readonly uploadService: UploadService) {}

  /**
   * Upload 1 ảnh sản phẩm (Admin)
   * POST /api/v1/upload/image
   */
  @Post('image')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @UseInterceptors(FileInterceptor('file', multerOptions))
  async uploadSingle(@UploadedFile() file?: any) {
    if (!file) {
      throw new BadRequestException('Vui lòng chọn file ảnh để tải lên');
    }
    return {
      message: 'Tải ảnh lên thành công',
      data: this.uploadService.formatFileResponse(file),
    };
  }

  /**
   * Upload nhiều ảnh sản phẩm cùng lúc (tối đa 5 ảnh) (Admin)
   * POST /api/v1/upload/images
   */
  @Post('images')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @UseInterceptors(FilesInterceptor('files', 5, multerOptions))
  async uploadMultiple(@UploadedFiles() files?: any[]) {
    if (!files || files.length === 0) {
      throw new BadRequestException('Vui lòng chọn ít nhất 1 file ảnh');
    }
    return {
      message: `Đã tải lên thành công ${files.length} ảnh`,
      data: files.map((file) => this.uploadService.formatFileResponse(file)),
    };
  }
}
