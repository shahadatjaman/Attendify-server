// // src/logger/custom-logger.service.ts
// import { Injectable } from '@nestjs/common';
// import * as winston from 'winston';

// @Injectable()
// export class CustomLogger {
//   private logger: winston.Logger;

//   constructor() {
//     this.logger = winston.createLogger({
//       level: 'debug',
//       format: winston.format.combine(
//         winston.format.timestamp(),
//         winston.format.printf(({ timestamp, level, message, context }) => {
//           return `[${timestamp}] [${level.toUpperCase()}]${context ? ` [${context}]` : ''} ${message}`;
//         }),
//       ),
//       transports: [
//         new winston.transports.Console(),
//         new winston.transports.File({ filename: 'logs/app.log' }),
//       ],
//     });
//   }

//   log(message: string, context?: string) {
//     this.logger.info(message, { context });
//   }

//   debug(message: string, context?: string) {
//     this.logger.debug(message, { context });
//   }

//   warn(message: string, context?: string) {
//     this.logger.warn(message, { context });
//   }

//   error(message: string, trace?: string, context?: string) {
//     this.logger.error(message + (trace ? `\nTrace: ${trace}` : ''), { context });
//   }
// }

import { Injectable } from '@nestjs/common';
import * as winston from 'winston';
import 'winston-daily-rotate-file';

@Injectable()
export class CustomLogger {
  private logger: winston.Logger;

  constructor() {
    this.logger = winston.createLogger({
      level: 'debug',
      format: winston.format.combine(
        winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
        winston.format.printf(({ timestamp, level, message, context }) => {
          return `[${timestamp}] [${level.toUpperCase()}]${context ? ` [${context}]` : ''} ${message}`;
        }),
      ),
      transports: [
        new winston.transports.Console(),

        // ✅ Daily rotated file logs
        new winston.transports.DailyRotateFile({
          dirname: 'logs',
          filename: '%DATE%.log',
          datePattern: 'YYYY-MM-DD',
          zippedArchive: false,
          maxSize: '20m',
          maxFiles: '14d',
          level: 'debug',
        }),
      ],
    });
  }

  log(message: string, context?: string) {
    this.logger.info(message, { context });
  }

  debug(message: string, context?: string) {
    this.logger.debug(message, { context });
  }

  warn(message: string, context?: string) {
    this.logger.warn(message, { context });
  }

  error(message: string, trace?: string, context?: string) {
    this.logger.error(`${message}${trace ? `\nTrace: ${trace}` : ''}`, { context });
  }
}
