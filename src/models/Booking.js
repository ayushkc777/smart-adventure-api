import mongoose from 'mongoose';

const travellerSchema = new mongoose.Schema(
  {
    count: { type: Number, min: 1, required: true },
    leadName: { type: String, trim: true, required: true },
    email: { type: String, trim: true, lowercase: true, required: true },
    phone: { type: String, trim: true, required: true },
  },
  { _id: false },
);

const emergencyContactSchema = new mongoose.Schema(
  {
    name: { type: String, trim: true, required: true },
    phone: { type: String, trim: true, required: true },
    relationship: { type: String, trim: true, default: 'Emergency contact' },
  },
  { _id: false },
);

const bookingSchema = new mongoose.Schema(
  {
    bookingReference: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    activity: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Activity',
      required: true,
    },
    operator: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Operator',
      required: true,
    },
    date: {
      type: Date,
      required: true,
    },
    travellers: {
      type: travellerSchema,
      required: true,
    },
    emergencyContact: {
      type: emergencyContactSchema,
      required: true,
    },
    extras: {
      type: [String],
      default: [],
    },
    totalPrice: {
      type: Number,
      min: 0,
      required: true,
    },
    bookingStatus: {
      type: String,
      enum: ['pending', 'awaiting_payment', 'confirmed', 'completed', 'cancelled'],
      default: 'pending',
    },
    paymentStatus: {
      type: String,
      enum: ['unpaid', 'paid', 'refunded', 'failed'],
      default: 'unpaid',
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

bookingSchema.index({ user: 1, createdAt: -1 });
bookingSchema.index({ bookingStatus: 1, date: 1 });

export const Booking = mongoose.model('Booking', bookingSchema);
