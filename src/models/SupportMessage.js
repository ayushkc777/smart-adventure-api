import mongoose from 'mongoose';

const supportMessageSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Email format is invalid.'],
    },
    phone: {
      type: String,
      trim: true,
      maxlength: 30,
      default: '',
    },
    category: {
      type: String,
      enum: ['booking', 'safety', 'operator', 'account', 'general'],
      default: 'general',
    },
    subject: {
      type: String,
      required: true,
      trim: true,
      maxlength: 160,
    },
    message: {
      type: String,
      required: true,
      trim: true,
      maxlength: 3000,
    },
    status: {
      type: String,
      enum: ['open', 'in_progress', 'resolved', 'closed'],
      default: 'open',
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform(doc, ret) {
        delete ret.__v;
        return ret;
      },
    },
  },
);

supportMessageSchema.index({ email: 1, status: 1 });

export const SupportMessage = mongoose.model('SupportMessage', supportMessageSchema);
