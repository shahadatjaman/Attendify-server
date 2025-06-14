import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

@Schema()
export class Shift extends Document {
  @Prop({ type: Types.ObjectId, ref: 'Department', required: true })
  dep: Types.ObjectId;

  @Prop({ required: true })
  startAt: string;

  @Prop({ required: true })
  endAt: string;

  @Prop({ required: true, unique: true })
  shiftName: string;

  @Prop([{ type: Types.ObjectId, ref: 'User' }])
  employees: Types.ObjectId[]; // ✅ New field
}

export const ShiftSchema = SchemaFactory.createForClass(Shift);
