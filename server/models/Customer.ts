import mongoose, { Document, Schema, Types } from 'mongoose';

export interface ICustomer extends Document {
  name: string;
  company: string;
  email: string;
  phone: string;
  notes: Array<{
    content: string;
    createdBy: Types.ObjectId;
    createdAt: Date;
  }>;
  tags: string[];
  owner: Types.ObjectId;
  deals: Array<{
    title: string;
    value: number;
    status: 'Open' | 'Won' | 'Lost';
    expectedCloseDate: Date;
    createdAt: Date;
  }>;
  convertedFromLead?: Types.ObjectId;
}

const customerSchema = new Schema<ICustomer>({
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  company: {
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
  notes: [{
    content: {
      type: String,
      required: true,
      trim: true,
      maxlength: 1000
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  tags: [{
    type: String,
    trim: true,
    maxlength: 30
  }],
  owner: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  deals: [{
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200
    },
    value: {
      type: Number,
      required: true,
      min: 0
    },
    status: {
      type: String,
      enum: ['Open', 'Won', 'Lost'],
      default: 'Open'
    },
    expectedCloseDate: {
      type: Date,
      required: true
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  convertedFromLead: {
    type: Schema.Types.ObjectId,
    ref: 'Lead'
  }
}, {
  timestamps: true
});

// Indexes for better query performance
customerSchema.index({ owner: 1 });
customerSchema.index({ email: 1 });
customerSchema.index({ company: 1 });
customerSchema.index({ createdAt: -1 });
customerSchema.index({ tags: 1 });

export const Customer = mongoose.model<ICustomer>('Customer', customerSchema);
