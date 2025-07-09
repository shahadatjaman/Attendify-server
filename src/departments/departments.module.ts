import { Module } from '@nestjs/common';
import { DepartmentsService } from './departments.service';
import { MongooseModule } from '@nestjs/mongoose';
import { Department, DepartmentSchema } from './schemas/dept.schema';
import { DepartmentController } from './departments.controller';
import { User, UserSchema } from 'src/users/schemas/user.schema';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Department.name, schema: DepartmentSchema }]),
    MongooseModule.forFeature([{ name: User.name, schema: UserSchema }]),
  ],
  providers: [DepartmentsService],
  controllers: [DepartmentController],
})
export class DepartmentsModule {}
