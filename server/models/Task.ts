import mongoose, { Document, Schema, Types } from 'mongoose';

export interface ITask extends Document {
  title: string;
  description?: string;
  dueDate: Date;
  status: 'Open' | 'In Progress' | 'Done';
  priority: 'Low' | 'Medium' | 'High';
  relatedTo: {
    type: 'Lead' | 'Customer';
    id: Types.ObjectId;
  };
  owner: Types.ObjectId;
  assignedTo?: Types.ObjectId;
  completedAt?: Date;
}

const taskSchema = new Schema<ITask>({
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200
  },
  description: {
    type: String,
    trim: true,
    maxlength: 1000
  },
  dueDate: {
    type: Date,
    required: true
  },
  status: {
    type: String,
    enum: ['Open', 'In Progress', 'Done'],
    default: 'Open'
  },
  priority: {
    type: String,
    enum: ['Low', 'Medium', 'High'],
    default: 'Medium'
  },
  relatedTo: {
    type: {
      type: String,
      enum: ['Lead', 'Customer'],
      required: true
    },
    id: {
      type: Schema.Types.ObjectId,
      required: true,
      refPath: 'relatedTo.type'
    }
  },
  owner: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  assignedTo: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  },
  completedAt: {
    type: Date
  }
}, {
  timestamps: true
});

// Indexes for better query performance
taskSchema.index({ owner: 1, status: 1 });
taskSchema.index({ assignedTo: 1, status: 1 });
taskSchema.index({ dueDate: 1 });
taskSchema.index({ status: 1 });
taskSchema.index({ priority: 1 });
taskSchema.index({ 'relatedTo.id': 1 });

// Virtual for checking if task is overdue
taskSchema.virtual('isOverdue').get(function() {
  if (this.status === 'Done') return false;
  return this.dueDate < new Date();
});

// Ensure virtual fields are serialized
taskSchema.set('toJSON', {
  virtuals: true
});

export const Task = mongoose.model<ITask>('Task', taskSchema);
