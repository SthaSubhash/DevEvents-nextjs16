import mongoose from 'mongoose';

// Store original env
const originalEnv = process.env;

// Mock mongoose before importing connectDB
jest.mock('mongoose', () => ({
  connect: jest.fn(),
  connection: {
    readyState: 0,
  },
  models: {},
}));

describe('MongoDB Connection Utility', () => {
  let connectDB: () => Promise<typeof mongoose>;
  let mockConnect: jest.MockedFunction<typeof mongoose.connect>;

  beforeEach(() => {
    // Clear all mocks
    jest.clearAllMocks();
    jest.resetModules();
    
    // Reset environment
    process.env = { ...originalEnv };
    
    // Reset global mongoose cache
    (global as any).mongoose = undefined;
    
    // Get fresh mock
    mockConnect = mongoose.connect as jest.MockedFunction<typeof mongoose.connect>;
    
    // Import fresh module
    connectDB = require('../mongodb').default;
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe('Environment Variable Validation', () => {
    test('should throw error when MONGODB_URI is not defined', () => {
      delete process.env.MONGODB_URI;
      
      // Need to require the module again after env change
      jest.resetModules();
      
      expect(() => {
        require('../mongodb');
      }).toThrow('Please define the MONGODB_URI environment variable inside .env.local');
    });

    test('should not throw error when MONGODB_URI is defined', () => {
      process.env.MONGODB_URI = 'mongodb://localhost:27017/test';
      
      jest.resetModules();
      
      expect(() => {
        require('../mongodb');
      }).not.toThrow();
    });

    test('should use MONGODB_URI from environment', () => {
      const testUri = 'mongodb://localhost:27017/test-db';
      process.env.MONGODB_URI = testUri;
      
      jest.resetModules();
      mockConnect.mockResolvedValue(mongoose);
      
      const freshConnectDB = require('../mongodb').default;
      
      return freshConnectDB().then(() => {
        expect(mockConnect).toHaveBeenCalledWith(
          testUri,
          expect.any(Object)
        );
      });
    });
  });

  describe('Connection Caching', () => {
    beforeEach(() => {
      process.env.MONGODB_URI = 'mongodb://localhost:27017/test';
      jest.resetModules();
      (global as any).mongoose = undefined;
    });

    test('should return cached connection if available', async () => {
      mockConnect.mockResolvedValue(mongoose);
      
      const freshConnectDB = require('../mongodb').default;
      
      // First call
      await freshConnectDB();
      expect(mockConnect).toHaveBeenCalledTimes(1);
      
      // Second call should use cache
      await freshConnectDB();
      expect(mockConnect).toHaveBeenCalledTimes(1);
    });

    test('should create new connection if cache is empty', async () => {
      mockConnect.mockResolvedValue(mongoose);
      
      const freshConnectDB = require('../mongodb').default;
      
      await freshConnectDB();
      
      expect(mockConnect).toHaveBeenCalledTimes(1);
    });

    test('should reuse connection promise if connection is in progress', async () => {
      let resolveConnection: (value: typeof mongoose) => void;
      const connectionPromise = new Promise<typeof mongoose>((resolve) => {
        resolveConnection = resolve;
      });
      
      mockConnect.mockReturnValue(connectionPromise as any);
      
      const freshConnectDB = require('../mongodb').default;
      
      // Start two connections simultaneously
      const promise1 = freshConnectDB();
      const promise2 = freshConnectDB();
      
      // Resolve the connection
      resolveConnection!(mongoose);
      
      await Promise.all([promise1, promise2]);
      
      // Should only call connect once
      expect(mockConnect).toHaveBeenCalledTimes(1);
    });

    test('should use global cache in development', async () => {
      mockConnect.mockResolvedValue(mongoose);
      
      const freshConnectDB = require('../mongodb').default;
      
      await freshConnectDB();
      
      // Global cache should be set
      expect((global as any).mongoose).toBeDefined();
      expect((global as any).mongoose.conn).toBe(mongoose);
    });
  });

  describe('Connection Options', () => {
    beforeEach(() => {
      process.env.MONGODB_URI = 'mongodb://localhost:27017/test';
      jest.resetModules();
    });

    test('should disable buffer commands', async () => {
      mockConnect.mockResolvedValue(mongoose);
      
      const freshConnectDB = require('../mongodb').default;
      
      await freshConnectDB();
      
      expect(mockConnect).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          bufferCommands: false,
        })
      );
    });

    test('should pass correct options to mongoose.connect', async () => {
      mockConnect.mockResolvedValue(mongoose);
      
      const freshConnectDB = require('../mongodb').default;
      
      await freshConnectDB();
      
      const callArgs = mockConnect.mock.calls[0];
      expect(callArgs[1]).toEqual({
        bufferCommands: false,
      });
    });
  });

  describe('Error Handling', () => {
    beforeEach(() => {
      process.env.MONGODB_URI = 'mongodb://localhost:27017/test';
      jest.resetModules();
      (global as any).mongoose = undefined;
    });

    test('should reset promise on connection error', async () => {
      const error = new Error('Connection failed');
      mockConnect.mockRejectedValueOnce(error);
      
      const freshConnectDB = require('../mongodb').default;
      
      // First attempt fails
      await expect(freshConnectDB()).rejects.toThrow('Connection failed');
      
      // Second attempt should retry
      mockConnect.mockResolvedValueOnce(mongoose);
      await freshConnectDB();
      
      expect(mockConnect).toHaveBeenCalledTimes(2);
    });

    test('should throw error when connection fails', async () => {
      const error = new Error('Database unreachable');
      mockConnect.mockRejectedValue(error);
      
      const freshConnectDB = require('../mongodb').default;
      
      await expect(freshConnectDB()).rejects.toThrow('Database unreachable');
    });

    test('should not cache failed connections', async () => {
      mockConnect
        .mockRejectedValueOnce(new Error('First attempt failed'))
        .mockResolvedValueOnce(mongoose);
      
      const freshConnectDB = require('../mongodb').default;
      
      // First attempt fails
      await expect(freshConnectDB()).rejects.toThrow();
      
      // Second attempt succeeds
      const result = await freshConnectDB();
      expect(result).toBe(mongoose);
    });

    test('should propagate connection errors', async () => {
      const customError = new Error('Custom connection error');
      mockConnect.mockRejectedValue(customError);
      
      const freshConnectDB = require('../mongodb').default;
      
      await expect(freshConnectDB()).rejects.toThrow('Custom connection error');
    });
  });

  describe('Return Value', () => {
    beforeEach(() => {
      process.env.MONGODB_URI = 'mongodb://localhost:27017/test';
      jest.resetModules();
    });

    test('should return mongoose instance on successful connection', async () => {
      mockConnect.mockResolvedValue(mongoose);
      
      const freshConnectDB = require('../mongodb').default;
      
      const result = await freshConnectDB();
      
      expect(result).toBe(mongoose);
    });

    test('should return same instance on subsequent calls', async () => {
      mockConnect.mockResolvedValue(mongoose);
      
      const freshConnectDB = require('../mongodb').default;
      
      const result1 = await freshConnectDB();
      const result2 = await freshConnectDB();
      
      expect(result1).toBe(result2);
    });
  });

  describe('TypeScript Types', () => {
    test('should have correct cache interface', () => {
      process.env.MONGODB_URI = 'mongodb://localhost:27017/test';
      jest.resetModules();
      
      const freshConnectDB = require('../mongodb').default;
      
      // Type check - should compile without errors
      const cache = (global as any).mongoose as {
        conn: typeof mongoose | null;
        promise: Promise<typeof mongoose> | null;
      };
      
      expect(cache).toBeDefined();
    });

    test('should return promise of mongoose type', async () => {
      process.env.MONGODB_URI = 'mongodb://localhost:27017/test';
      jest.resetModules();
      mockConnect.mockResolvedValue(mongoose);
      
      const freshConnectDB = require('../mongodb').default;
      
      const result: typeof mongoose = await freshConnectDB();
      expect(result).toBeDefined();
    });
  });

  describe('Connection URI Formats', () => {
    test('should handle MongoDB Atlas URI', async () => {
      const atlasUri = 'mongodb+srv://user:pass@cluster.mongodb.net/dbname?retryWrites=true&w=majority';
      process.env.MONGODB_URI = atlasUri;
      
      jest.resetModules();
      mockConnect.mockResolvedValue(mongoose);
      
      const freshConnectDB = require('../mongodb').default;
      
      await freshConnectDB();
      
      expect(mockConnect).toHaveBeenCalledWith(atlasUri, expect.any(Object));
    });

    test('should handle local MongoDB URI', async () => {
      const localUri = 'mongodb://localhost:27017/localdb';
      process.env.MONGODB_URI = localUri;
      
      jest.resetModules();
      mockConnect.mockResolvedValue(mongoose);
      
      const freshConnectDB = require('../mongodb').default;
      
      await freshConnectDB();
      
      expect(mockConnect).toHaveBeenCalledWith(localUri, expect.any(Object));
    });

    test('should handle URI with authentication', async () => {
      const authUri = 'mongodb://username:password@localhost:27017/authdb';
      process.env.MONGODB_URI = authUri;
      
      jest.resetModules();
      mockConnect.mockResolvedValue(mongoose);
      
      const freshConnectDB = require('../mongodb').default;
      
      await freshConnectDB();
      
      expect(mockConnect).toHaveBeenCalledWith(authUri, expect.any(Object));
    });
  });

  describe('Edge Cases', () => {
    test('should handle empty string MONGODB_URI', () => {
      process.env.MONGODB_URI = '';
      
      jest.resetModules();
      
      expect(() => {
        require('../mongodb');
      }).toThrow('Please define the MONGODB_URI environment variable inside .env.local');
    });

    test('should handle undefined global mongoose initially', async () => {
      process.env.MONGODB_URI = 'mongodb://localhost:27017/test';
      (global as any).mongoose = undefined;
      
      jest.resetModules();
      mockConnect.mockResolvedValue(mongoose);
      
      const freshConnectDB = require('../mongodb').default;
      
      await freshConnectDB();
      
      expect((global as any).mongoose).toBeDefined();
    });

    test('should initialize cache correctly when global is undefined', () => {
      process.env.MONGODB_URI = 'mongodb://localhost:27017/test';
      delete (global as any).mongoose;
      
      jest.resetModules();
      
      require('../mongodb');
      
      expect((global as any).mongoose).toBeDefined();
      expect((global as any).mongoose.conn).toBeNull();
      expect((global as any).mongoose.promise).toBeNull();
    });
  });

  describe('Concurrent Connections', () => {
    beforeEach(() => {
      process.env.MONGODB_URI = 'mongodb://localhost:27017/test';
      jest.resetModules();
      (global as any).mongoose = undefined;
    });

    test('should handle multiple concurrent connection requests', async () => {
      mockConnect.mockResolvedValue(mongoose);
      
      const freshConnectDB = require('../mongodb').default;
      
      // Make multiple concurrent requests
      const promises = [
        freshConnectDB(),
        freshConnectDB(),
        freshConnectDB(),
        freshConnectDB(),
        freshConnectDB(),
      ];
      
      const results = await Promise.all(promises);
      
      // Should only connect once
      expect(mockConnect).toHaveBeenCalledTimes(1);
      
      // All should return the same instance
      results.forEach((result) => {
        expect(result).toBe(mongoose);
      });
    });
  });
});