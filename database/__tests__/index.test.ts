import * as databaseIndex from '../index';
import Event from '../event.model';
import Booking from '../booking.model';

// Mock mongoose
jest.mock('mongoose', () => {
  const actualMongoose = jest.requireActual('mongoose');
  return {
    ...actualMongoose,
    connect: jest.fn(),
    connection: {
      readyState: 1,
      close: jest.fn(),
    },
    models: {},
    model: jest.fn(),
  };
});

describe('Database Index Exports', () => {
  describe('Model Exports', () => {
    test('should export Event model as default export', () => {
      expect(databaseIndex.Event).toBeDefined();
      expect(databaseIndex.Event).toBe(Event);
    });

    test('should export Booking model as default export', () => {
      expect(databaseIndex.Booking).toBeDefined();
      expect(databaseIndex.Booking).toBe(Booking);
    });
  });

  describe('Type Exports', () => {
    test('should export IEvent type', () => {
      // This is a type-level test - if it compiles, the type is exported
      type EventType = databaseIndex.IEvent;
      
      const mockEvent: EventType = {
        title: 'Test',
        slug: 'test',
        description: 'Test desc',
        overview: 'Test overview',
        image: '/test.png',
        venue: 'Test Venue',
        location: 'Test Location',
        date: '2025-12-01',
        time: '09:00',
        mode: 'online',
        audience: 'Developers',
        agenda: ['Item 1'],
        organizer: 'Test Org',
        tags: ['tech'],
        createdAt: new Date(),
        updatedAt: new Date(),
      } as any;

      expect(mockEvent.title).toBe('Test');
    });

    test('should export IBooking type', () => {
      // This is a type-level test - if it compiles, the type is exported
      type BookingType = databaseIndex.IBooking;
      
      const mockBooking: Partial<BookingType> = {
        email: 'test@example.com',
      };

      expect(mockBooking.email).toBe('test@example.com');
    });
  });

  describe('Module Structure', () => {
    test('should have exactly two model exports', () => {
      const exports = Object.keys(databaseIndex);
      const modelExports = exports.filter((key) => 
        key === 'Event' || key === 'Booking'
      );
      
      expect(modelExports.length).toBe(2);
    });

    test('should provide clean barrel export pattern', () => {
      // Verify that the index provides a single point of access
      expect(typeof databaseIndex).toBe('object');
      expect(databaseIndex.Event).toBeDefined();
      expect(databaseIndex.Booking).toBeDefined();
    });
  });

  describe('Import Patterns', () => {
    test('should support named imports', () => {
      const { Event: EventModel, Booking: BookingModel } = databaseIndex;
      
      expect(EventModel).toBeDefined();
      expect(BookingModel).toBeDefined();
    });

    test('should support namespace import', () => {
      expect(databaseIndex).toBeDefined();
      expect(databaseIndex.Event).toBeDefined();
      expect(databaseIndex.Booking).toBeDefined();
    });
  });

  describe('Re-export Validation', () => {
    test('should re-export Event with correct properties', () => {
      expect(databaseIndex.Event.schema).toBeDefined();
      expect(databaseIndex.Event.modelName).toBeDefined();
    });

    test('should re-export Booking with correct properties', () => {
      expect(databaseIndex.Booking.schema).toBeDefined();
      expect(databaseIndex.Booking.modelName).toBeDefined();
    });
  });
});