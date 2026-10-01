/**
 * Tests for the config Zustand store.
 * We test the state transitions, not the API calls themselves.
 */
import { act } from 'react-test-renderer';

// Mock the api module
jest.mock('../../api/client', () => ({
  api: {
    get: jest.fn(),
  },
}));

const { api } = require('../../api/client');

// Import AFTER mocking
let useConfigStore: ReturnType<typeof import('../../store/configStore')['useConfigStore']>;
let getState: () => ReturnType<typeof useConfigStore>;

beforeEach(() => {
  jest.resetModules();
  jest.clearAllMocks();
  // Re-import the store fresh for each test so state is reset
  const module = require('../../store/configStore');
  useConfigStore = module.useConfigStore;
  getState = module.useConfigStore.getState;
});

describe('configStore', () => {
  it('starts with null config and not loading', () => {
    const state = getState();
    expect(state.config).toBeNull();
    expect(state.isLoading).toBe(false);
  });

  it('fetchConfig sets config on success', async () => {
    const mockConfig = {
      categories: [{ _id: 'cat1', name: 'Symptoms' }],
      questions: [],
      options: [],
      quickActions: [],
      reminders: [],
      configVersion: 1,
    };
    api.get.mockResolvedValueOnce(mockConfig);

    await act(async () => {
      await getState().fetchConfig();
    });

    expect(getState().config).toEqual(mockConfig);
    expect(getState().isLoading).toBe(false);
  });

  it('fetchConfig sets isLoading to true during fetch, false after', async () => {
    let resolveApi: (v: unknown) => void;
    api.get.mockReturnValueOnce(new Promise(r => { resolveApi = r; }));

    const fetchPromise = getState().fetchConfig();
    expect(getState().isLoading).toBe(true);

    await act(async () => {
      resolveApi!({ categories: [], questions: [], options: [], quickActions: [], reminders: [], configVersion: 1 });
      await fetchPromise;
    });

    expect(getState().isLoading).toBe(false);
  });

  it('fetchConfig does not refetch if config is already loaded and not invalidated', async () => {
    const mockConfig = { categories: [], questions: [], options: [], quickActions: [], reminders: [], configVersion: 1 };
    api.get.mockResolvedValue(mockConfig);

    await act(async () => { await getState().fetchConfig(); });
    await act(async () => { await getState().fetchConfig(); });

    // Should only call once since config is already set
    expect(api.get).toHaveBeenCalledTimes(1);
  });

  it('invalidate clears config and forces next fetchConfig to reload', async () => {
    const mockConfig = { categories: [], questions: [], options: [], quickActions: [], reminders: [], configVersion: 1 };
    api.get.mockResolvedValue(mockConfig);

    await act(async () => { await getState().fetchConfig(); });
    expect(getState().config).not.toBeNull();

    act(() => { getState().invalidate(); });
    expect(getState().config).toBeNull();

    await act(async () => { await getState().fetchConfig(); });
    expect(api.get).toHaveBeenCalledTimes(2);
  });

  it('sets error state when fetchConfig fails', async () => {
    api.get.mockRejectedValueOnce(new Error('Network error'));

    await act(async () => { await getState().fetchConfig(); });

    expect(getState().config).toBeNull();
    expect(getState().isLoading).toBe(false);
  });
});
