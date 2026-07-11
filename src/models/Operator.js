import mongoose from 'mongoose';

const operatorSchema = new mongoose.Schema(
  {
    companyName: {
      type: String,
      required: [true, 'Company name is required.'],
      trim: true,
      maxlength: 120,
    },
    licenseNumber: {
      type: String,
      required: [true, 'License number is required.'],
      unique: true,
      trim: true,
      maxlength: 80,
    },
    location: {
      type: String,
      required: [true, 'Location is required.'],
      trim: true,
      maxlength: 120,
    },
    safetyScore: {
      type: Number,
      min: 0,
      max: 100,
      default: 80,
    },
    responseRate: {
      type: Number,
      min: 0,
      max: 100,
      default: 90,
    },
    yearsExperience: {
      type: Number,
      min: 0,
      default: 1,
    },
    languages: {
      type: [String],
      default: ['English'],
    },
    insuranceAvailable: {
      type: Boolean,
      default: true,
    },
    logo: {
      type: String,
      trim: true,
      default: '',
    },
    status: {
      type: String,
      enum: ['active', 'suspended', 'inactive'],
      default: 'active',
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

operatorSchema.index({ companyName: 'text', location: 'text', licenseNumber: 'text' });

export const Operator = mongoose.model('Operator', operatorSchema);
