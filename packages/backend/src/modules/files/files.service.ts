import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../config/prisma.service';
import * as fs from 'fs';
import * as path from 'path';
import { randomUUID } from 'crypto';

@Injectable()
export class FilesService {
  private readonly logger = new Logger(FilesService.name);
  private readonly storageProvider: string;
  private readonly localStoragePath: string;
  private readonly maxFileSize: number;
  private readonly allowedFileTypes: string[];

  constructor(
    private configService: ConfigService,
    private prisma: PrismaService,
  ) {
    this.storageProvider = this.configService.get<string>('STORAGE_PROVIDER', 'local');
    this.localStoragePath = this.configService.get<string>('LOCAL_STORAGE_PATH', './uploads');
    this.maxFileSize = parseInt(this.configService.get<string>('MAX_FILE_SIZE', '10485760'), 10);
    this.allowedFileTypes = this.configService.get<string>('ALLOWED_FILE_TYPES', 'pdf,jpg,jpeg,png').split(',');

    // Ensure upload directory exists
    if (this.storageProvider === 'local') {
      if (!fs.existsSync(this.localStoragePath)) {
        fs.mkdirSync(this.localStoragePath, { recursive: true });
      }
    }
  }

  async uploadFile(
    file: Express.Multer.File,
    userId: string,
    metadata?: Record<string, any>,
  ): Promise<any> {
    try {
      // Validate file
      this.validateFile(file);

      // Generate unique filename
      const fileExtension = path.extname(file.originalname);
      const uniqueFilename = `${randomUUID()}${fileExtension}`;

      let filePath: string;
      let fileUrl: string | null = null;

      if (this.storageProvider === 'local') {
        // Save to local storage
        filePath = path.join(this.localStoragePath, uniqueFilename);
        fs.writeFileSync(filePath, file.buffer);
        fileUrl = `/uploads/${uniqueFilename}`;
      } else {
        // TODO: Implement S3/Azure upload
        filePath = uniqueFilename;
      }

      // Create file record in database
      const fileRecord = await this.prisma.file.create({
        data: {
          filename: uniqueFilename,
          originalName: file.originalname,
          mimeType: file.mimetype,
          size: file.size,
          path: filePath,
          url: fileUrl,
          uploadedBy: userId,
          virusScanned: false, // TODO: Implement virus scanning
          metadata: metadata || {},
        },
      });

      this.logger.log(`File uploaded successfully: ${uniqueFilename}`);
      return fileRecord;
    } catch (error) {
      this.logger.error(`Error uploading file: ${error.message}`);
      throw error;
    }
  }

  async getFile(fileId: string): Promise<any> {
    const file = await this.prisma.file.findUnique({
      where: { id: fileId },
    });

    if (!file) {
      throw new BadRequestException('File not found');
    }

    return file;
  }

  async deleteFile(fileId: string, userId: string): Promise<void> {
    const file = await this.prisma.file.findUnique({
      where: { id: fileId },
    });

    if (!file) {
      throw new BadRequestException('File not found');
    }

    if (file.uploadedBy !== userId) {
      throw new BadRequestException('Unauthorized to delete this file');
    }

    // Delete physical file if local storage
    if (this.storageProvider === 'local' && fs.existsSync(file.path)) {
      fs.unlinkSync(file.path);
    }

    // Delete database record
    await this.prisma.file.delete({
      where: { id: fileId },
    });

    this.logger.log(`File deleted successfully: ${file.filename}`);
  }

  private validateFile(file: Express.Multer.File): void {
    // Check file size
    if (file.size > this.maxFileSize) {
      throw new BadRequestException(
        `File size exceeds maximum allowed size of ${this.maxFileSize} bytes`,
      );
    }

    // Check file type
    const fileExtension = path.extname(file.originalname).slice(1).toLowerCase();
    if (!this.allowedFileTypes.includes(fileExtension)) {
      throw new BadRequestException(
        `File type .${fileExtension} is not allowed. Allowed types: ${this.allowedFileTypes.join(', ')}`,
      );
    }
  }

  async getUserFiles(userId: string): Promise<any[]> {
    return this.prisma.file.findMany({
      where: { uploadedBy: userId },
      orderBy: { createdAt: 'desc' },
    });
  }
}
