import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

@Schema()
export class Shift extends Document {
  @Prop({ type: Types.ObjectId, ref: 'Department', required: true })
  dept: Types.ObjectId;

  @Prop({ required: true })
  shiftName: string;

  @Prop({ required: true })
  startAt: string;

  @Prop({ required: true })
  endAt: string;

  @Prop([{ type: Types.ObjectId, ref: 'User' }])
  employees: Types.ObjectId[]; // ✅ New field

  @Prop({ required: true })
  days: string[]; // ✅ New field
}

export const ShiftSchema = SchemaFactory.createForClass(Shift);
