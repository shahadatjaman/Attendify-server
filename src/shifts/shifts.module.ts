// shifts/shift.module.ts
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ShiftSchema } from './schemas/shift.schema';
import { ShiftController } from './shifts.controller';
import { ShiftService } from './shifts.service';

@Module({
  imports: [MongooseModule.forFeature([{ name: 'Shift', schema: ShiftSchema }])],
  controllers: [ShiftController],
  providers: [ShiftService],
})
export class ShiftModule {}
