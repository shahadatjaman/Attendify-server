import { Schema, Prop, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

@Schema()
export class NewLog extends Document {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  employee: Types.ObjectId;

  @Prop({ required: true })
  logDate: string;

  @Prop()
  checkInAt: string;

  @Prop()
  checkOutAt: string;

  @Prop()
  status: string;

  @Prop()
  role: string;

  @Prop({ default: 'CARD' })
  verifyType: 'CARD';
}

export const NewLogSchema = SchemaFactory.createForClass(NewLog);
