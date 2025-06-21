import { MiddlewareConsumer, Module, NestModule, RequestMethod } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { MongooseModule } from '@nestjs/mongoose';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtStrategy } from './jwt.strategy';
import { User, UserSchema } from '../users/schemas/user.schema';
import { MulterMiddleware } from 'src/middleware/SingleFileUpload';
import { CloudinaryService } from 'src/shared/cloudinary.service';
import { LocalStrategy } from './local.strategy';
import { LoggerModule } from 'src/logger/logger.module';
import { EmailService } from 'src/email/email.service';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: User.name, schema: UserSchema }]),
    PassportModule,
    JwtModule.register({
      secret: 'secretKey',
      signOptions: { expiresIn: '1d' },
    }),
    LoggerModule,
  ],
  providers: [AuthService, JwtStrategy, CloudinaryService, LocalStrategy, EmailService],
  controllers: [AuthController],
})
export class AuthModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(MulterMiddleware).forRoutes({
      path: 'auth/register',
      method: RequestMethod.POST,
    });
  }
}
