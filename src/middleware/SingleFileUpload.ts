import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import * as multer from 'multer';
import * as path from 'path';

@Injectable()
export class MulterMiddleware implements NestMiddleware {
  use(req: any, res: Response, next: NextFunction) {
    const UPLOADS_FOLDER = './assets/uploads';
    const MAX_FILE_SIZE = 1 * 1024 * 1024; // 1MB
    const ALLOWED_MIME_TYPES = ['image/png', 'image/jpg', 'image/jpeg'];

    const storage = multer.diskStorage({
      destination: (_req, _file, cb) => cb(null, UPLOADS_FOLDER),
      filename: (_req, file, cb) => {
        const ext = path.extname(file.originalname);
        const baseName = path.basename(file.originalname, ext)
          .toLowerCase()
          .replace(/\s+/g, '-');
        const timestamp = Date.now();
        cb(null, `${baseName}-${timestamp}${ext}`);
      },
    });

    const fileFilter = (req: Request, file: any, cb: multer.FileFilterCallback) => {
      if (file.fieldname !== 'file') {
        return cb(new Error('Unexpected field: only "file" is allowed'));
      }

      if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
        return cb(new Error('Only .jpg, .png, or .jpeg formats are allowed'));
      }

      cb(null, true);
    };

    const upload = multer({
      storage,
      limits: { fileSize: MAX_FILE_SIZE },
      fileFilter,
    });

    upload.single('file')(req, res, (err: any) => {
     
      if (err) {
        return res.status(500).json({
          message: err.message || err.toString(),
          status: false,
          statusCode: 500,
        });
      }

     

   
      if(req.file){
      // Attach file to body for downstream middleware/controllers
      req.body.file = req.file;
      }

      next();
    });
  }
}
