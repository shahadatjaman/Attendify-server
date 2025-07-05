import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ timestamps: true })
export class UserDevice extends Document {
  @Prop({ required: true })
  userId: string;

  @Prop({ required: true })
  ipAddress: string;

  @Prop({ required: true })
  userAgent: string;

  @Prop({ required: true })
  location: string; // e.g., "New York, USA"

  @Prop({ default: Date.now })
  lastActive: Date;
}

export const UserDeviceSchema = SchemaFactory.createForClass(UserDevice);
