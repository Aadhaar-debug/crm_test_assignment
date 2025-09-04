import mongoose, { Document, Schema, Types } from 'mongoose';

export interface ILead extends Document {
  name: string;
  email: string;
  phone: string;
  status: 'New' | 'In Progress' | 'Closed Won' | 'Closed Lost';
  source: string;
  assignedAgent: Types.ObjectId;
  notes?: string;
  isArchived: boolean;
  convertedToCustomer?: Types.ObjectId;
  convertedAt?: Date;
}

const leadSchema = new Schema<ILead>({
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  email: {
    type: String,
    required: true,
    lowercase: true,
    trim: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
  },
  phone: {
    type: String,
    required: true,
    trim: true,
    maxlength: 20
  },
  status: {
    type: String,
    enum: ['New', 'In Progress', 'Closed Won', 'Closed Lost'],
    default: 'New'
  },
  source: {
    type: String,
    required: true,
    trim: true,
    maxlength: 50
  },
  assignedAgent: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  notes: {
    type: String,
    trim: true,
    maxlength: 1000
  },
  isArchived: {
    type: Boolean,
    default: false
  },
  convertedToCustomer: {
    type: Schema.Types.ObjectId,
    ref: 'Customer'
  },
  convertedAt: {
    type: Date
  }
}, {
  timestamps: true
});

// Indexes for better query performance
leadSchema.index({ assignedAgent: 1, status: 1 });
leadSchema.index({ status: 1 });
leadSchema.index({ createdAt: -1 });
leadSchema.index({ email: 1 });
leadSchema.index({ isArchived: 1 });

export const Lead = mongoose.model<ILead>('Lead', leadSchema);
