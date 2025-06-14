import { Module } from '@nestjs/common';
import { DepartmentsService } from './departments.service';
import { MongooseModule } from '@nestjs/mongoose';
import { Department, DepartmentSchema } from './schemas/dept.schema';
import { DepartmentController } from './departments.controller';

@Module({
  imports: [MongooseModule.forFeature([{ name: Department.name, schema: DepartmentSchema }])],
  providers: [DepartmentsService],
  controllers: [DepartmentController],
})
export class DepartmentsModule {}
