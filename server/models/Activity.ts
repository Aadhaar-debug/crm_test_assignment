import mongoose, { Document, Schema, Types } from 'mongoose';

export interface IActivity extends Document {
  user: Types.ObjectId;
  action: string;
  entityType: 'Lead' | 'Customer' | 'Task' | 'User';
  entityId: Types.ObjectId;
  details: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
}

const activitySchema = new Schema<IActivity>({
  user: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  action: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  entityType: {
    type: String,
    enum: ['Lead', 'Customer', 'Task', 'User'],
    required: true
  },
  entityId: {
    type: Schema.Types.ObjectId,
    required: true
  },
  details: {
    type: Schema.Types.Mixed,
    default: {}
  },
  ipAddress: {
    type: String,
    trim: true
  },
  userAgent: {
    type: String,
    trim: true
  }
}, {
  timestamps: true
});

// Indexes for better query performance
activitySchema.index({ user: 1, createdAt: -1 });
activitySchema.index({ entityType: 1, entityId: 1 });
activitySchema.index({ createdAt: -1 });
activitySchema.index({ action: 1 });

export const Activity = mongoose.model<IActivity>('Activity', activitySchema);
