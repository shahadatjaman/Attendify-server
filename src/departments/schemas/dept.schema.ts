import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

@Schema()
export class Department extends Document {
  @Prop({ required: true, unique: true })
  deptName: string;

  @Prop()
  description?: string;

  @Prop({ type: Types.ObjectId, ref: 'User' })
  manager?: Types.ObjectId;

  @Prop({ required: false, default: 'ACTIVE' })
  status?: string;

  @Prop([{ type: Types.ObjectId, ref: 'User' }])
  employees: Types.ObjectId[];
  static nam: string;
}

export const DepartmentSchema = SchemaFactory.createForClass(Department);
