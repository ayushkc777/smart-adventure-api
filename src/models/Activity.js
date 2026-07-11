import mongoose from 'mongoose';
import slugify from 'slugify';

const galleryItemSchema = new mongoose.Schema(
  {
    url: { type: String, required: true, trim: true },
    alt: { type: String, trim: true, default: '' },
  },
  { _id: false },
);

const operatorPriceSchema = new mongoose.Schema(
  {
    operator: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Operator',
      required: true,
    },
    packageName: {
      type: String,
      trim: true,
      default: 'Standard experience',
    },
    price: {
      type: Number,
      required: true,
      min: 0,
    },
    currency: {
      type: String,
      trim: true,
      default: 'NPR',
    },
    includedServices: {
      type: [String],
      default: [],
    },
  },
  { _id: false },
);

const activitySchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Activity title is required.'],
      trim: true,
      maxlength: 140,
    },
    slug: {
      type: String,
      unique: true,
      lowercase: true,
      trim: true,
    },
    description: {
      type: String,
      required: [true, 'Description is required.'],
      trim: true,
      maxlength: 3000,
    },
    province: {
      type: String,
      required: [true, 'Province is required.'],
      trim: true,
    },
    district: {
      type: String,
      required: [true, 'District is required.'],
      trim: true,
    },
    difficulty: {
      type: String,
      enum: ['Easy', 'Moderate', 'Challenging', 'Extreme'],
      required: true,
    },
    duration: {
      type: String,
      required: [true, 'Duration is required.'],
      trim: true,
    },
    safetyScore: {
      type: Number,
      min: 0,
      max: 100,
      default: 80,
    },
    riskLevel: {
      type: String,
      enum: ['Low', 'Medium', 'High'],
      required: true,
    },
    bestSeason: {
      type: [String],
      default: [],
    },
    gallery: {
      type: [galleryItemSchema],
      default: [],
    },
    featured: {
      type: Boolean,
      default: false,
    },
    status: {
      type: String,
      enum: ['active', 'inactive', 'archived'],
      default: 'active',
    },
    operatorIds: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Operator',
      },
    ],
    operatorPrices: {
      type: [operatorPriceSchema],
      default: [],
    },
    priceFrom: {
      type: Number,
      min: 0,
      default: 0,
    },
    ratingAverage: {
      type: Number,
      min: 0,
      max: 5,
      default: 0,
    },
    reviewCount: {
      type: Number,
      min: 0,
      default: 0,
    },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform(doc, ret) {
        delete ret.__v;
        return ret;
      },
    },
  },
);

activitySchema.index({ title: 'text', description: 'text', district: 'text', province: 'text' });
activitySchema.index({ featured: 1, status: 1 });

activitySchema.pre('validate', function createSlug(next) {
  if ((this.isModified('title') || !this.slug) && this.title) {
    this.slug = slugify(this.title, { lower: true, strict: true });
  }

  if (this.operatorPrices?.length) {
    this.operatorIds = [...new Set(this.operatorPrices.map((item) => item.operator.toString()))];
    this.priceFrom = Math.min(...this.operatorPrices.map((item) => item.price));
  }

  next();
});

export const Activity = mongoose.model('Activity', activitySchema);
