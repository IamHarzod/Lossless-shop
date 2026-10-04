import { Injectable, BadRequestException } from '@nestjs/common';
import { existsSync, mkdirSync } from 'fs';
import { extname, join } from 'path';
import multer, { diskStorage } from 'multer';

@Injectable()
export class UploadService {
  private readonly uploadPath = join(process.cwd(), 'uploads', 'products');

  constructor() {
    // Tự động tạo thư mục uploads/products nếu chưa tồn tại
    if (!existsSync(this.uploadPath)) {
      mkdirSync(this.uploadPath, { recursive: true });
    }
  }

  /**
   * Cấu hình Multer diskStorage lưu ảnh vào uploads/products
   */
  getMulterOptions() {
    return {
      storage: diskStorage({
        destination: (_req, _file, cb) => {
          cb(null, this.uploadPath);
        },
        filename: (_req, file, cb) => {
          const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
          const ext = extname(file.originalname).toLowerCase();
          cb(null, `product-${uniqueSuffix}${ext}`);
        },
      }),
      fileFilter: (_req: any, file: Express.Multer.File, cb: any) => {
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
        fileSize: 5 * 1024 * 1024, // Tối đa 5MB mỗi ảnh
      },
    };
  }

  /**
   * Tạo URL đường dẫn tĩnh cho file đã upload
   */
  formatFileResponse(file: Express.Multer.File) {
    return {
      filename: file.filename,
      originalName: file.originalname,
      mimeType: file.mimetype,
      size: file.size,
      url: `/uploads/products/${file.filename}`,
    };
  }
}
