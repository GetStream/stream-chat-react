import { act, renderHook, waitFor } from '@testing-library/react';

const { loadState } = vi.hoisted(() => ({ loadState: { attempts: 0 } }));

// Reject the first dataset load, then succeed — the offline / stale-chunk scenario the
// picker must recover from without a full page reload.
vi.mock('../../data', () => ({
  loadEmojiData: vi.fn(() => {
    loadState.attempts += 1;
    return loadState.attempts === 1
      ? Promise.reject(new Error('chunk load failed'))
      : Promise.resolve({ aliases: {}, categories: [], emojis: {} });
  }),
}));

import { useEmojiPickerState } from '../useEmojiPickerState';

describe('useEmojiPickerState', () => {
  beforeEach(() => {
    loadState.attempts = 0;
  });

  it('surfaces an error when the dataset fails to load, then recovers on retry', async () => {
    const { result } = renderHook(() => useEmojiPickerState());

    await waitFor(() => expect(result.current.error).toBe(true));
    expect(result.current.data).toBeNull();

    act(() => {
      result.current.retry();
    });

    await waitFor(() => expect(result.current.data).not.toBeNull());
    expect(result.current.error).toBe(false);
    expect(loadState.attempts).toBe(2);
  });
});
