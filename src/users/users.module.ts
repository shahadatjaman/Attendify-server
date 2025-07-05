import { MiddlewareConsumer, Module, NestModule, RequestMethod } from '@nestjs/common';
import { UserService } from './users.service';
import { UserController } from './users.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { User, UserSchema } from './schemas/user.schema';
import { MulterMiddleware } from 'src/middleware/SingleFileUpload';
import { CloudinaryService } from 'src/shared/cloudinary.service';

@Module({
  imports: [MongooseModule.forFeature([{ name: User.name, schema: UserSchema }])],
  providers: [UserService, CloudinaryService],
  controllers: [UserController],
})
export class UsersModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(MulterMiddleware).forRoutes(
      {
        path: 'users',
        method: RequestMethod.POST,
      },
      {
        path: 'users/:id',
        method: RequestMethod.PUT,
      },
    );
  }
}
