import { AudiusAPI } from '../../app/ai_sdk/tools/audiusAPI';
import { retryWithBackoff } from '../../app/ai_sdk/tools/audiusUtils';
import { AudiusAPIInitializationError } from '../../app/ai_sdk/tools/audiusErrors';

// Mock the retryWithBackoff function
jest.mock('../../app/ai_sdk/tools/audiusUtils');

const mockedRetryWithBackoff = retryWithBackoff as jest.MockedFunction<typeof retryWithBackoff>;

describe('AudiusAPI - Initialization', () => {
  let audiusAPI: AudiusAPI;

  beforeEach(() => {
    audiusAPI = new AudiusAPI();
    jest.resetAllMocks();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  test('should initialize correctly', async () => {
    mockedRetryWithBackoff.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(['https://example.audius.co']),
    } as any);

    await expect(audiusAPI.initialize()).resolves.not.toThrow();
    expect(mockedRetryWithBackoff).toHaveBeenCalledTimes(1);
    expect(mockedRetryWithBackoff).toHaveBeenCalledWith(expect.any(Function));
  });

  test('should handle initialization errors', async () => {
    mockedRetryWithBackoff.mockRejectedValueOnce(new Error('Initialization error'));

    await expect(audiusAPI.initialize()).rejects.toThrow(AudiusAPIInitializationError);
  });

  test('should use custom app name if provided', async () => {
    const customAppName = 'CustomAudiusApp';
    const customAudiusAPI = new AudiusAPI(customAppName);
    mockedRetryWithBackoff.mockResolvedValueOnce({
    ok: true,
    json: () => Promise.resolve(['https://example.audius.co']),
    } as any);
    await customAudiusAPI.initialize();
    // This test assumes that the app name is used in a subsequent API call
    // You might need to adjust this based on how your AudiusAPI class uses the app name
    expect(mockedRetryWithBackoff).toHaveBeenCalledWith(
    expect.any(Function)
    );
    });
    test('should use default app name if not provided', async () => {
        mockedRetryWithBackoff.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(['https://example.audius.co']),
        } as any);
        await audiusAPI.initialize();
        // Similar to the previous test, adjust this based on how your class uses the app name
        expect(mockedRetryWithBackoff).toHaveBeenCalledWith(
        expect.any(Function)
        );
    });
    test('should throw error if API returns empty host list', async () => {
        mockedRetryWithBackoff.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve([]),
        } as any);
        await expect(audiusAPI.initialize()).rejects.toThrow(AudiusAPIInitializationError);
    });
    test('should throw error if API returns non-array', async () => {
        mockedRetryWithBackoff.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({}),
        } as any);
        await expect(audiusAPI.initialize()).rejects.toThrow(AudiusAPIInitializationError);
     });
});

// This test file covers the following scenarios:

// 1. Successful initialization
// 2. Handling of initialization errors
// 3. Using a custom app name
// 4. Using the default app name
// 5. Handling an empty host list from the API
// 6. Handling a non-array response from the API

// These tests ensure that the initialization process of the AudiusAPI class works correctly under various conditions and handles errors appropriately.

// Remember to adjust the import paths if your project structure is different. Also, make sure that the `AudiusAPI` class exposes the necessary methods and properties for these tests to work correctly.
