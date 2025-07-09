// shifts/shift.module.ts
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ShiftSchema, Shift } from './schemas/shift.schema';
import { ShiftController } from './shifts.controller';
import { ShiftService } from './shifts.service';
import { DepartmentsService } from 'src/departments/departments.service';
import { Department, DepartmentSchema } from 'src/departments/schemas/dept.schema';
import { User, UserSchema } from 'src/users/schemas/user.schema';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Shift.name, schema: ShiftSchema }]),
    MongooseModule.forFeature([{ name: Department.name, schema: DepartmentSchema }]),
    MongooseModule.forFeature([{ name: User.name, schema: UserSchema }]),
  ],
  controllers: [ShiftController],
  providers: [ShiftService, DepartmentsService],
})
export class ShiftModule {}
