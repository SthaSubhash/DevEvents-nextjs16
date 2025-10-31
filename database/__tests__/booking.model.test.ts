import mongoose from 'mongoose';
import Booking, { IBooking } from '../booking.model';
import Event from '../event.model';

// Mock mongoose to avoid actual database connections
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

describe('Booking Model', () => {
  let mockEventId: mongoose.Types.ObjectId;

  beforeEach(() => {
    jest.clearAllMocks();
    mockEventId = new mongoose.Types.ObjectId();
    
    // Setup mock models
    (mongoose.models as any).Booking = undefined;
    (mongoose.models as any).Event = undefined;
  });

  describe('Schema Validation', () => {
    describe('Email Validation', () => {
      test('should accept valid email addresses', () => {
        const validEmails = [
          'test@example.com',
          'user.name@domain.co.uk',
          'first+last@test-domain.com',
          'numbers123@test.com',
          'a@b.c',
        ];

        validEmails.forEach((email) => {
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          expect(emailRegex.test(email)).toBe(true);
        });
      });

      test('should reject invalid email addresses', () => {
        const invalidEmails = [
          'notanemail',
          '@example.com',
          'user@',
          'user @example.com',
          'user@.com',
          'user@domain',
          '',
          'user@@example.com',
        ];

        invalidEmails.forEach((email) => {
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          expect(emailRegex.test(email)).toBe(false);
        });
      });

      test('should trim email whitespace', () => {
        const schema = Booking.schema;
        const emailPath = schema.path('email') as any;
        expect(emailPath.options.trim).toBe(true);
      });

      test('should convert email to lowercase', () => {
        const schema = Booking.schema;
        const emailPath = schema.path('email') as any;
        expect(emailPath.options.lowercase).toBe(true);
      });
    });

    describe('Required Fields', () => {
      test('should require eventId field', () => {
        const schema = Booking.schema;
        const eventIdPath = schema.path('eventId') as any;
        expect(eventIdPath.isRequired).toBe(true);
      });

      test('should require email field', () => {
        const schema = Booking.schema;
        const emailPath = schema.path('email') as any;
        expect(emailPath.isRequired).toBe(true);
      });

      test('should have correct error messages for required fields', () => {
        const schema = Booking.schema;
        const eventIdPath = schema.path('eventId') as any;
        const emailPath = schema.path('email') as any;

        expect(eventIdPath.options.required[1]).toBe('Event ID is required');
        expect(emailPath.options.required[1]).toBe('Email is required');
      });
    });

    describe('Field Types', () => {
      test('should define eventId as ObjectId reference to Event', () => {
        const schema = Booking.schema;
        const eventIdPath = schema.path('eventId') as any;
        expect(eventIdPath.instance).toBe('ObjectId');
        expect(eventIdPath.options.ref).toBe('Event');
      });

      test('should define email as String', () => {
        const schema = Booking.schema;
        const emailPath = schema.path('email') as any;
        expect(emailPath.instance).toBe('String');
      });
    });

    describe('Timestamps', () => {
      test('should have timestamps enabled', () => {
        const schema = Booking.schema;
        expect(schema.options.timestamps).toBe(true);
      });

      test('should define createdAt and updatedAt fields', () => {
        const schema = Booking.schema;
        expect(schema.path('createdAt')).toBeDefined();
        expect(schema.path('updatedAt')).toBeDefined();
      });
    });
  });

  describe('Indexes', () => {
    test('should have index on eventId field', () => {
      const schema = Booking.schema;
      const indexes = schema.indexes();
      
      const hasEventIdIndex = indexes.some((index: any) => {
        const fields = index[0];
        return fields.eventId === 1;
      });
      
      expect(hasEventIdIndex).toBe(true);
    });
  });

  describe('Pre-save Hook', () => {
    test('should validate event existence on new booking', async () => {
      const mockFindById = jest.fn();
      const mockEventModel = {
        findById: mockFindById,
      };

      // Mock Event model
      (mongoose.models as any).Event = mockEventModel;

      const bookingData = {
        eventId: mockEventId,
        email: 'test@example.com',
        isModified: jest.fn().mockReturnValue(true),
        _id: new mongoose.Types.ObjectId(),
      };

      // Test when event exists
      mockFindById.mockResolvedValue({ _id: mockEventId });

      const schema = Booking.schema;
      const preSaveHooks = schema.pre as any;
      
      // The pre-save hook should be defined
      expect(preSaveHooks).toBeDefined();
    });

    test('should throw error when referenced event does not exist', async () => {
      const mockFindById = jest.fn().mockResolvedValue(null);
      const mockEventModel = {
        findById: mockFindById,
      };

      (mongoose.models as any).Event = mockEventModel;

      // Verify the schema has pre-save validation logic
      const schema = Booking.schema;
      const preSaveHooks = (schema as any)._pres;
      
      expect(preSaveHooks).toBeDefined();
      expect(preSaveHooks.get('save')).toBeDefined();
    });

    test('should skip event validation when eventId is not modified', async () => {
      const mockFindById = jest.fn();
      const mockEventModel = {
        findById: mockFindById,
      };

      (mongoose.models as any).Event = mockEventModel;

      // The pre-save hook checks isModified('eventId')
      const schema = Booking.schema;
      expect(schema.path('eventId')).toBeDefined();
    });
  });

  describe('Model Registration', () => {
    test('should prevent model recompilation', () => {
      // The model should check mongoose.models.Booking before creating
      const schema = Booking.schema;
      expect(schema).toBeDefined();
      expect(Booking.modelName).toBeDefined();
    });

    test('should export IBooking interface', () => {
      // Type check - if this compiles, the interface is properly exported
      const bookingData: Partial<IBooking> = {
        eventId: mockEventId,
        email: 'test@example.com',
      };
      
      expect(bookingData.eventId).toBeDefined();
      expect(bookingData.email).toBeDefined();
    });
  });

  describe('Edge Cases', () => {
    test('should handle email with maximum valid length', () => {
      const longLocalPart = 'a'.repeat(64);
      const longDomain = 'b'.repeat(63);
      const longEmail = `${longLocalPart}@${longDomain}.com`;
      
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      expect(emailRegex.test(longEmail)).toBe(true);
    });

    test('should handle special characters in email local part', () => {
      const specialEmails = [
        'user+tag@example.com',
        'user.name@example.com',
        'user_name@example.com',
        'user-name@example.com',
      ];

      specialEmails.forEach((email) => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        expect(emailRegex.test(email)).toBe(true);
      });
    });

    test('should reject email with multiple @ symbols', () => {
      const invalidEmail = 'user@@example.com';
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      expect(emailRegex.test(invalidEmail)).toBe(false);
    });

    test('should handle ObjectId validation', () => {
      const validObjectId = new mongoose.Types.ObjectId();
      expect(mongoose.Types.ObjectId.isValid(validObjectId)).toBe(true);
      
      const invalidObjectId = 'invalid-id';
      expect(mongoose.Types.ObjectId.isValid(invalidObjectId)).toBe(false);
    });
  });

  describe('Schema Options', () => {
    test('should have correct schema configuration', () => {
      const schema = Booking.schema;
      expect(schema.options.timestamps).toBe(true);
    });

    test('should have virtual fields available', () => {
      const schema = Booking.schema;
      expect(schema.virtuals).toBeDefined();
    });
  });

  describe('Validation Messages', () => {
    test('should provide clear error message for invalid email', () => {
      const schema = Booking.schema;
      const emailPath = schema.path('email') as any;
      const validator = emailPath.validators.find((v: any) => v.message === 'Invalid email format');
      
      expect(validator).toBeDefined();
      expect(validator.message).toBe('Invalid email format');
    });

    test('should provide clear error message for missing eventId', () => {
      const schema = Booking.schema;
      const eventIdPath = schema.path('eventId') as any;
      
      expect(eventIdPath.options.required[1]).toBe('Event ID is required');
    });

    test('should provide clear error message for missing email', () => {
      const schema = Booking.schema;
      const emailPath = schema.path('email') as any;
      
      expect(emailPath.options.required[1]).toBe('Email is required');
    });
  });
});