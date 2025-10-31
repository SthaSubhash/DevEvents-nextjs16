import mongoose, { Document, Model, Schema } from 'mongoose';

// TypeScript interface for Booking document
export interface IBooking extends Document {
  eventId: mongoose.Types.ObjectId;
  email: string;
  createdAt: Date;
  updatedAt: Date;
}

const bookingSchema = new Schema<IBooking>(
  {
    eventId: {
      type: Schema.Types.ObjectId,
      ref: 'Event',
      required: [true, 'Event ID is required'],
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      lowercase: true,
      trim: true,
      validate: {
        validator: (v: string) => {
          // RFC 5322 compliant email validation
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          return emailRegex.test(v);
        },
        message: 'Invalid email format',
      },
    },
  },
  {
    timestamps: true,
  }
);

// Pre-save hook: Validate that referenced event exists
bookingSchema.pre('save', async function (next) {
  if (this.isModified('eventId')) {
    // Import Event model dynamically to avoid circular dependency
    const Event = mongoose.models.Event || (await import('./event.model')).default;
    
    const eventExists = await Event.findById(this.eventId);
    
    if (!eventExists) {
      throw new Error('Referenced event does not exist');
    }
  }

  next();
});

// Add index on eventId for faster queries
bookingSchema.index({ eventId: 1 });

// Prevent model recompilation in development
const Booking: Model<IBooking> = 
  mongoose.models.Booking || mongoose.model<IBooking>('Booking', bookingSchema);

export default Booking;
