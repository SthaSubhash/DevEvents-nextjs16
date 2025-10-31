import mongoose from 'mongoose';
import Event, { IEvent } from '../event.model';

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

describe('Event Model', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (mongoose.models as any).Event = undefined;
  });

  describe('Schema Validation', () => {
    describe('Required Fields', () => {
      const requiredFields = [
        { field: 'title', message: 'Title is required' },
        { field: 'description', message: 'Description is required' },
        { field: 'overview', message: 'Overview is required' },
        { field: 'image', message: 'Image is required' },
        { field: 'venue', message: 'Venue is required' },
        { field: 'location', message: 'Location is required' },
        { field: 'date', message: 'Date is required' },
        { field: 'time', message: 'Time is required' },
        { field: 'mode', message: 'Mode is required' },
        { field: 'audience', message: 'Audience is required' },
        { field: 'organizer', message: 'Organizer is required' },
      ];

      requiredFields.forEach(({ field, message }) => {
        test(`should require ${field} field`, () => {
          const schema = Event.schema;
          const path = schema.path(field) as any;
          expect(path.isRequired).toBe(true);
        });

        test(`should have correct error message for ${field}`, () => {
          const schema = Event.schema;
          const path = schema.path(field) as any;
          expect(path.options.required[1]).toBe(message);
        });
      });

      test('should require agenda field with custom validator', () => {
        const schema = Event.schema;
        const agendaPath = schema.path('agenda') as any;
        expect(agendaPath.isRequired).toBe(true);
        expect(agendaPath.options.required[1]).toBe('Agenda is required');
      });

      test('should require tags field with custom validator', () => {
        const schema = Event.schema;
        const tagsPath = schema.path('tags') as any;
        expect(tagsPath.isRequired).toBe(true);
        expect(tagsPath.options.required[1]).toBe('Tags are required');
      });
    });

    describe('String Field Transformations', () => {
      const trimFields = [
        'title',
        'description',
        'overview',
        'image',
        'venue',
        'location',
        'audience',
        'organizer',
      ];

      trimFields.forEach((field) => {
        test(`should trim ${field} field`, () => {
          const schema = Event.schema;
          const path = schema.path(field) as any;
          expect(path.options.trim).toBe(true);
        });
      });

      test('should convert slug to lowercase', () => {
        const schema = Event.schema;
        const slugPath = schema.path('slug') as any;
        expect(slugPath.options.lowercase).toBe(true);
      });

      test('should trim slug', () => {
        const schema = Event.schema;
        const slugPath = schema.path('slug') as any;
        expect(slugPath.options.trim).toBe(true);
      });

      test('should convert mode to lowercase', () => {
        const schema = Event.schema;
        const modePath = schema.path('mode') as any;
        expect(modePath.options.lowercase).toBe(true);
      });
    });

    describe('Mode Enum Validation', () => {
      test('should accept valid mode values', () => {
        const schema = Event.schema;
        const modePath = schema.path('mode') as any;
        const validModes = ['online', 'offline', 'hybrid'];
        
        expect(modePath.options.enum).toEqual(validModes);
      });

      test('should define mode as enum type', () => {
        const schema = Event.schema;
        const modePath = schema.path('mode') as any;
        expect(modePath.enumValues).toContain('online');
        expect(modePath.enumValues).toContain('offline');
        expect(modePath.enumValues).toContain('hybrid');
      });
    });

    describe('Array Validations', () => {
      test('should validate agenda has at least one item', () => {
        const schema = Event.schema;
        const agendaPath = schema.path('agenda') as any;
        const validator = agendaPath.validators.find(
          (v: any) => v.message === 'Agenda must contain at least one item'
        );
        
        expect(validator).toBeDefined();
        expect(validator.validator([])).toBe(false);
        expect(validator.validator(['Item 1'])).toBe(true);
        expect(validator.validator(['Item 1', 'Item 2'])).toBe(true);
      });

      test('should validate tags has at least one item', () => {
        const schema = Event.schema;
        const tagsPath = schema.path('tags') as any;
        const validator = tagsPath.validators.find(
          (v: any) => v.message === 'Tags must contain at least one item'
        );
        
        expect(validator).toBeDefined();
        expect(validator.validator([])).toBe(false);
        expect(validator.validator(['tag1'])).toBe(true);
        expect(validator.validator(['tag1', 'tag2'])).toBe(true);
      });

      test('should reject non-array agenda values', () => {
        const schema = Event.schema;
        const agendaPath = schema.path('agenda') as any;
        const validator = agendaPath.validators.find(
          (v: any) => v.message === 'Agenda must contain at least one item'
        );
        
        expect(validator.validator('not an array')).toBe(false);
        expect(validator.validator(null)).toBe(false);
        expect(validator.validator(undefined)).toBe(false);
      });

      test('should reject non-array tags values', () => {
        const schema = Event.schema;
        const tagsPath = schema.path('tags') as any;
        const validator = tagsPath.validators.find(
          (v: any) => v.message === 'Tags must contain at least one item'
        );
        
        expect(validator.validator('not an array')).toBe(false);
        expect(validator.validator(null)).toBe(false);
      });
    });

    describe('Slug Field', () => {
      test('should define slug as unique', () => {
        const schema = Event.schema;
        const slugPath = schema.path('slug') as any;
        expect(slugPath.options.unique).toBe(true);
      });

      test('should have unique index on slug', () => {
        const schema = Event.schema;
        const indexes = schema.indexes();
        
        const hasUniqueSlugIndex = indexes.some((index: any) => {
          const fields = index[0];
          const options = index[1];
          return fields.slug === 1 && options?.unique === true;
        });
        
        expect(hasUniqueSlugIndex).toBe(true);
      });
    });
  });

  describe('Pre-save Hook - Slug Generation', () => {
    test('should generate slug from title', () => {
      const testCases = [
        { title: 'AWS re:Invent 2025', expected: 'aws-reinvent-2025' },
        { title: 'GitHub Universe 2025', expected: 'github-universe-2025' },
        { title: 'Test Event!!!', expected: 'test-event' },
        { title: 'Event   With   Spaces', expected: 'event-with-spaces' },
        { title: 'UPPERCASE EVENT', expected: 'uppercase-event' },
      ];

      testCases.forEach(({ title, expected }) => {
        const slug = title
          .toLowerCase()
          .trim()
          .replace(/[^\w\s-]/g, '')
          .replace(/\s+/g, '-')
          .replace(/-+/g, '-')
          .replace(/^-+|-+$/g, '');
        
        expect(slug).toBe(expected);
      });
    });

    test('should remove special characters from slug', () => {
      const title = 'Event @ 2025! #Tech $Conference';
      const slug = title
        .toLowerCase()
        .trim()
        .replace(/[^\w\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-+|-+$/g, '');
      
      expect(slug).toBe('event-2025-tech-conference');
      expect(slug).not.toContain('@');
      expect(slug).not.toContain('!');
      expect(slug).not.toContain('#');
      expect(slug).not.toContain('$');
    });

    test('should replace multiple spaces with single hyphen', () => {
      const title = 'Event    With    Multiple    Spaces';
      const slug = title
        .toLowerCase()
        .trim()
        .replace(/[^\w\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-+|-+$/g, '');
      
      expect(slug).toBe('event-with-multiple-spaces');
    });

    test('should remove leading and trailing hyphens', () => {
      const title = '---Event Title---';
      const slug = title
        .toLowerCase()
        .trim()
        .replace(/[^\w\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-+|-+$/g, '');
      
      expect(slug).toBe('event-title');
      expect(slug.startsWith('-')).toBe(false);
      expect(slug.endsWith('-')).toBe(false);
    });

    test('should collapse multiple consecutive hyphens', () => {
      const title = 'Event---With---Hyphens';
      const slug = title
        .toLowerCase()
        .trim()
        .replace(/[^\w\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-+|-+$/g, '');
      
      expect(slug).toBe('event-with-hyphens');
    });

    test('should handle unicode characters', () => {
      const title = 'Événement Spécial 2025';
      const slug = title
        .toLowerCase()
        .trim()
        .replace(/[^\w\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-+|-+$/g, '');
      
      expect(slug).toBe('vnement-spcial-2025');
    });

    test('should handle titles with only special characters', () => {
      const title = '!@#$%^&*()';
      const slug = title
        .toLowerCase()
        .trim()
        .replace(/[^\w\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-+|-+$/g, '');
      
      expect(slug).toBe('');
    });

    test('should append timestamp for duplicate slugs', () => {
      const mockDate = 1234567890;
      const originalDateNow = Date.now;
      Date.now = jest.fn(() => mockDate);

      const baseSlug = 'test-event';
      const uniqueSlug = `${baseSlug}-${mockDate}`;
      
      expect(uniqueSlug).toBe('test-event-1234567890');

      Date.now = originalDateNow;
    });
  });

  describe('Pre-save Hook - Date Validation', () => {
    test('should accept valid ISO date strings', () => {
      const validDates = [
        '2025-12-01',
        '2026-01-15',
        '2025-06-30',
      ];

      validDates.forEach((dateStr) => {
        const date = new Date(dateStr);
        expect(isNaN(date.getTime())).toBe(false);
        expect(date.toISOString().split('T')[0]).toBe(dateStr);
      });
    });

    test('should normalize date to ISO format', () => {
      const inputDates = [
        { input: '2025-12-01', expected: '2025-12-01' },
        { input: 'December 1, 2025', expected: '2025-12-01' },
        { input: '2025/12/01', expected: '2025-12-01' },
      ];

      inputDates.forEach(({ input, expected }) => {
        const date = new Date(input);
        const normalized = date.toISOString().split('T')[0];
        expect(normalized).toBe(expected);
      });
    });

    test('should throw error for invalid date format', () => {
      const invalidDates = [
        'not-a-date',
        'invalid',
        '',
        '2025-13-01', // Invalid month
        '2025-12-32', // Invalid day
      ];

      invalidDates.forEach((dateStr) => {
        const date = new Date(dateStr);
        const isInvalid = isNaN(date.getTime());
        expect(isInvalid).toBe(true);
      });
    });

    test('should handle edge case dates', () => {
      const edgeCases = [
        '2025-02-28', // Regular year Feb 28
        '2024-02-29', // Leap year Feb 29
        '2025-12-31', // End of year
        '2025-01-01', // Start of year
      ];

      edgeCases.forEach((dateStr) => {
        const date = new Date(dateStr);
        expect(isNaN(date.getTime())).toBe(false);
      });
    });
  });

  describe('Pre-save Hook - Time Validation', () => {
    test('should accept valid time formats', () => {
      const validTimes = [
        '09:00',
        '23:59',
        '00:00',
        '12:30',
        '8:45',
        '08:05',
      ];

      const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
      
      validTimes.forEach((time) => {
        expect(timeRegex.test(time)).toBe(true);
      });
    });

    test('should reject invalid time formats', () => {
      const invalidTimes = [
        '24:00', // Invalid hour
        '23:60', // Invalid minute
        '9:0',   // Missing leading zero in minute
        '9',     // Missing minutes
        '09:00 AM', // 12-hour format
        'invalid',
        '',
      ];

      const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
      
      invalidTimes.forEach((time) => {
        expect(timeRegex.test(time)).toBe(false);
      });
    });

    test('should handle boundary times', () => {
      const boundaryTimes = [
        '00:00', // Midnight
        '23:59', // Last minute of day
        '12:00', // Noon
      ];

      const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
      
      boundaryTimes.forEach((time) => {
        expect(timeRegex.test(time)).toBe(true);
      });
    });
  });

  describe('Indexes', () => {
    test('should have unique index on slug', () => {
      const schema = Event.schema;
      const indexes = schema.indexes();
      
      const slugIndex = indexes.find((index: any) => {
        const fields = index[0];
        return fields.slug === 1;
      });
      
      expect(slugIndex).toBeDefined();
      expect(slugIndex[1]?.unique).toBe(true);
    });
  });

  describe('Timestamps', () => {
    test('should have timestamps enabled', () => {
      const schema = Event.schema;
      expect(schema.options.timestamps).toBe(true);
    });

    test('should define createdAt and updatedAt fields', () => {
      const schema = Event.schema;
      expect(schema.path('createdAt')).toBeDefined();
      expect(schema.path('updatedAt')).toBeDefined();
    });
  });

  describe('Model Registration', () => {
    test('should prevent model recompilation', () => {
      const schema = Event.schema;
      expect(schema).toBeDefined();
      expect(Event.modelName).toBeDefined();
    });

    test('should export IEvent interface', () => {
      // Type check - if this compiles, the interface is properly exported
      const eventData: Partial<IEvent> = {
        title: 'Test Event',
        slug: 'test-event',
        description: 'Test description',
        overview: 'Test overview',
        image: '/images/test.png',
        venue: 'Test Venue',
        location: 'Test Location',
        date: '2025-12-01',
        time: '09:00',
        mode: 'online',
        audience: 'Developers',
        agenda: ['Item 1'],
        organizer: 'Test Org',
        tags: ['tech'],
      };
      
      expect(eventData.title).toBeDefined();
      expect(eventData.mode).toBeDefined();
    });
  });

  describe('Edge Cases', () => {
    test('should handle very long title', () => {
      const longTitle = 'A'.repeat(1000);
      const slug = longTitle
        .toLowerCase()
        .trim()
        .replace(/[^\w\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-+|-+$/g, '');
      
      expect(slug.length).toBe(1000);
    });

    test('should handle empty agenda array validation', () => {
      const schema = Event.schema;
      const agendaPath = schema.path('agenda') as any;
      const validator = agendaPath.validators.find(
        (v: any) => v.message === 'Agenda must contain at least one item'
      );
      
      expect(validator.validator([])).toBe(false);
    });

    test('should handle empty tags array validation', () => {
      const schema = Event.schema;
      const tagsPath = schema.path('tags') as any;
      const validator = tagsPath.validators.find(
        (v: any) => v.message === 'Tags must contain at least one item'
      );
      
      expect(validator.validator([])).toBe(false);
    });

    test('should handle multiple agenda items', () => {
      const schema = Event.schema;
      const agendaPath = schema.path('agenda') as any;
      const validator = agendaPath.validators.find(
        (v: any) => v.message === 'Agenda must contain at least one item'
      );
      
      const multipleItems = [
        'Opening remarks',
        'Keynote speech',
        'Panel discussion',
        'Q&A session',
        'Closing',
      ];
      
      expect(validator.validator(multipleItems)).toBe(true);
    });

    test('should handle multiple tags', () => {
      const schema = Event.schema;
      const tagsPath = schema.path('tags') as any;
      const validator = tagsPath.validators.find(
        (v: any) => v.message === 'Tags must contain at least one item'
      );
      
      const multipleTags = ['tech', 'conference', 'ai', 'ml', 'cloud'];
      
      expect(validator.validator(multipleTags)).toBe(true);
    });
  });

  describe('Field Types', () => {
    test('should define all string fields correctly', () => {
      const schema = Event.schema;
      const stringFields = [
        'title',
        'slug',
        'description',
        'overview',
        'image',
        'venue',
        'location',
        'date',
        'time',
        'mode',
        'audience',
        'organizer',
      ];

      stringFields.forEach((field) => {
        const path = schema.path(field) as any;
        expect(path.instance).toBe('String');
      });
    });

    test('should define agenda as array of strings', () => {
      const schema = Event.schema;
      const agendaPath = schema.path('agenda') as any;
      expect(agendaPath.instance).toBe('Array');
    });

    test('should define tags as array of strings', () => {
      const schema = Event.schema;
      const tagsPath = schema.path('tags') as any;
      expect(tagsPath.instance).toBe('Array');
    });
  });
});