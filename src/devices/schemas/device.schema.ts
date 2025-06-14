// devices/schemas/device.schema.ts
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

@Schema()
export class Device extends Document {
  @Prop({ required: true, unique: true })
  deviceName: string;

  @Prop({ required: true, unique: true })
  deviceIp: string;

  @Prop({ required: true })
  devicePort: string;

  @Prop({ default: 'INACTIVE' }) // ACTIVE | INACTIVE | OFFLINE
  status: string;

  @Prop({ default: null })
  lastConnectedAt: Date;

  @Prop([{ type: Types.ObjectId, ref: 'User' }])
  users: Types.ObjectId[];

  // `logCount` is virtual, not stored in DB
}

export const DeviceSchema = SchemaFactory.createForClass(Device);

// Virtual field for log count (based on referenced model later)
DeviceSchema.virtual('logCount', {
  ref: 'NewLog',
  localField: '_id',
  foreignField: 'deviceId', // assuming `deviceId` is stored in log
  count: true,
});
