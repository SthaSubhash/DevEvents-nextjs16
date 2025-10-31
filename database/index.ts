// Export all database models from a single entry point
export { default as Event } from './event.model';
export { default as Booking } from './booking.model';

// Export types for TypeScript consumers
export type { IEvent } from './event.model';
export type { IBooking } from './booking.model';
