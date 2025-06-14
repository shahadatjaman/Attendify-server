import { Injectable } from '@nestjs/common';
import { v2 as cloudinary } from 'cloudinary';
import { ConfigService } from '@nestjs/config';
import { Readable } from 'stream';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class CloudinaryService {
  constructor(private configService: ConfigService) {
    const name = this.configService.get('CLOUDINARY_NAME');
    const key = this.configService.get('CLOUDINARY_API_KEY');
    const secret = this.configService.get('CLOUDINARY_API_SECRET');

    cloudinary.config({
      cloud_name: name,
      api_key: key,
      api_secret: secret,
    });
  }

  async uploadImage(file: any): Promise<string> {
    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        { folder: 'avatars' },
        (error, result) => {
          if (error) return reject(error);
          if (result) {
            resolve(result.secure_url);
          }
        },
      );

      const filePath = path.resolve(file); // absolute path
      const fileStream = fs.createReadStream(filePath);

      fileStream.pipe(uploadStream);
    });
  }
}
