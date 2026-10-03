import { Injectable, OnModuleInit } from '@nestjs/common';
import * as Minio from 'minio';
import { extname } from 'path';
import { UploadedFile } from './uploaded-file.interface';

@Injectable()
export class MinioService implements OnModuleInit {
  private client: Minio.Client;
  private readonly bucket = 'compression-algorithms-media';

  constructor() {
    this.client = new Minio.Client({
      endPoint: 'localhost',
      port: 9000,
      useSSL: false,
      accessKey: 'minioadmin',
      secretKey: 'minioadmin',
    });
  }

  async onModuleInit() {
    const exists = await this.client.bucketExists(this.bucket);
    if (!exists) {
      await this.client.makeBucket(this.bucket, 'us-east-1');
      const policy = {
        Version: '2012-10-17',
        Statement: [
          {
            Action: ['s3:GetObject'],
            Effect: 'Allow',
            Principal: '*',
            Resource: [`arn:aws:s3:::${this.bucket}/*`],
          },
        ],
      };
      await this.client.setBucketPolicy(this.bucket, JSON.stringify(policy));
    }
  }

  async uploadFile(file: UploadedFile, prefix: string): Promise<string> {
    const randomHex = Math.random().toString(36).substring(2, 10);
    const ext = extname(file.originalname).toLowerCase();
    const fileName = `${prefix}_${Date.now()}_${randomHex}${ext}`;

    await this.client.putObject(
      this.bucket,
      fileName,
      file.buffer,
      file.size,
      { 'Content-Type': file.mimetype },
    );

    return `http://localhost:9000/${this.bucket}/${fileName}`;
  }
}
