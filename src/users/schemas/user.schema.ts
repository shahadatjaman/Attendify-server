import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

@Schema()
export class User extends Document {
  @Prop({ required: true })
  firstname: string;

  @Prop({ required: true })
  lastname: string;

  @Prop()
  avatar?: string;

  @Prop({ required: false })
  gender?: string;

  @Prop()
  cardNo?: string;

  @Prop()
  blood?: string;

  @Prop()
  religion?: string;

  @Prop({ type: Types.ObjectId, ref: 'Department', required: true })
  dept: Types.ObjectId;

  // Optional role, default is 'employee'
  @Prop({ default: 'employee' })
  roles?: string[];

  // Optional phone number
  @Prop()
  phone?: string;

  @Prop({ required: true, unique: true, minlength: 4, maxlength: 4 })
  userId: string;

  @Prop({ required: true })
  email: string;

  @Prop({ required: true })
  password: string;

  @Prop({ default: false })
  isVerified?: string;
}

export const UserSchema = SchemaFactory.createForClass(User);
