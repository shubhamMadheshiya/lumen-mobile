import { apiRequest, ApiError, saveTokens, clearTokens } from '../client';

// Mock expo-secure-store
jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn(),
  setItemAsync: jest.fn(),
  deleteItemAsync: jest.fn(),
}));

const secureStore = require('expo-secure-store');

const mockFetch = jest.fn();
global.fetch = mockFetch;

function jsonResponse(body: unknown, status = 200): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    headers: { get: () => 'application/json' },
    json: () => Promise.resolve(body),
    text: () => Promise.resolve(JSON.stringify(body)),
  } as unknown as Response;
}

beforeEach(() => {
  jest.clearAllMocks();
  secureStore.getItemAsync.mockResolvedValue(null);
  secureStore.setItemAsync.mockResolvedValue(undefined);
  secureStore.deleteItemAsync.mockResolvedValue(undefined);
});

describe('apiRequest', () => {
  it('makes a GET request and returns data', async () => {
    mockFetch.mockResolvedValueOnce(jsonResponse({ success: true, data: { id: '123' } }));
    const result = await apiRequest('/test');
    expect(result).toEqual({ id: '123' });
    expect(mockFetch).toHaveBeenCalledTimes(1);
    const [url] = mockFetch.mock.calls[0];
    expect(url).toContain('/test');
  });

  it('attaches Authorization header when token exists', async () => {
    secureStore.getItemAsync.mockResolvedValueOnce('my-access-token');
    mockFetch.mockResolvedValueOnce(jsonResponse({ success: true, data: {} }));
    await apiRequest('/me');
    const [, opts] = mockFetch.mock.calls[0];
    expect(opts.headers.Authorization).toBe('Bearer my-access-token');
  });

  it('does not attach Authorization header when no token', async () => {
    secureStore.getItemAsync.mockResolvedValueOnce(null);
    mockFetch.mockResolvedValueOnce(jsonResponse({ success: true, data: {} }));
    await apiRequest('/pub');
    const [, opts] = mockFetch.mock.calls[0];
    expect(opts.headers.Authorization).toBeUndefined();
  });

  it('throws ApiError on non-ok response', async () => {
    mockFetch.mockResolvedValue(jsonResponse({ success: false, message: 'Not found' }, 404));
    await expect(apiRequest('/missing')).rejects.toThrow(ApiError);
    await expect(apiRequest('/missing2')).rejects.toMatchObject({ statusCode: 404 });
  });

  it('refreshes token on 401 and retries the request', async () => {
    secureStore.getItemAsync
      .mockResolvedValueOnce('expired-token')   // initial access token
      .mockResolvedValueOnce('refresh-token')   // refresh token lookup
      .mockResolvedValueOnce('new-access-token'); // second request's access token

    // First call: 401; refresh call: success; retry: success
    mockFetch
      .mockResolvedValueOnce(jsonResponse({ success: false, message: 'Unauthorized' }, 401))
      .mockResolvedValueOnce(jsonResponse({ data: { accessToken: 'new-access-token', refreshToken: 'new-refresh-token' } }, 200))
      .mockResolvedValueOnce(jsonResponse({ success: true, data: { ok: true } }, 200));

    const result = await apiRequest('/secured');
    expect(result).toEqual({ ok: true });
    expect(mockFetch).toHaveBeenCalledTimes(3); // original + refresh + retry
  });

  it('throws session-expired ApiError when refresh fails', async () => {
    secureStore.getItemAsync
      .mockResolvedValueOnce('expired-token')
      .mockResolvedValueOnce('bad-refresh-token');

    mockFetch
      .mockResolvedValueOnce(jsonResponse({}, 401))
      .mockResolvedValueOnce(jsonResponse({ message: 'Invalid token' }, 401));

    await expect(apiRequest('/secured')).rejects.toMatchObject({ statusCode: 401 });
    expect(secureStore.deleteItemAsync).toHaveBeenCalledTimes(2); // both tokens cleared
  });
});

describe('ApiError', () => {
  it('is an instance of Error', () => {
    const err = new ApiError(400, 'Bad request');
    expect(err).toBeInstanceOf(Error);
    expect(err.message).toBe('Bad request');
    expect(err.statusCode).toBe(400);
  });

  it('stores extra errors', () => {
    const err = new ApiError(422, 'Validation failed', ['field required']);
    expect(err.errors).toEqual(['field required']);
  });
});
