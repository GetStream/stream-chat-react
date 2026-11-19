import { act, renderHook } from '@testing-library/react';

import { useFirstPageLoadRetry } from '../useFirstPageLoadRetry';
import type { UseFirstPageLoadRetryParams } from '../useFirstPageLoadRetry';

const mockAnnounce = vi.fn();

vi.mock('../../../Accessibility/useAriaLiveAnnouncer', () => ({
  useAriaLiveAnnouncer: () => mockAnnounce,
}));

type Paginator = { isLoading: boolean; lastQueryError: Error | undefined };

const deferred = () => {
  let resolve: () => void = () => undefined;
  const promise = new Promise<void>((done) => (resolve = done));
  return { promise, resolve };
};

const renderRetry = (initialProps: UseFirstPageLoadRetryParams) =>
  renderHook((props: UseFirstPageLoadRetryParams) => useFirstPageLoadRetry(props), {
    initialProps,
  });

describe('useFirstPageLoadRetry', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('keeps showing the retried error while the retry runs, then the paginator state', async () => {
    const error = new Error('first page failed');
    const paginator: Paginator = { isLoading: false, lastQueryError: error };
    const reload = deferred();
    const params = {
      firstPageLoadError: error,
      loadedMessage: 'Loaded',
      paginator,
      reload: vi.fn(() => reload.promise),
    };
    const { rerender, result } = renderRetry(params);

    act(() => result.current.retry());
    // The paginator loads, so it reports no first-page error meanwhile.
    rerender({ ...params, firstPageLoadError: undefined });
    expect(result.current).toMatchObject({ error, isRetrying: true });

    paginator.lastQueryError = undefined;
    await act(async () => {
      reload.resolve();
      await reload.promise;
    });

    expect(result.current).toMatchObject({ error: undefined, isRetrying: false });
    expect(mockAnnounce).toHaveBeenCalledWith('Loaded');
  });

  it('announces nothing when the retry fails too', async () => {
    const error = new Error('first page failed');
    const paginator: Paginator = { isLoading: false, lastQueryError: error };
    const reload = deferred();
    const params = {
      firstPageLoadError: error,
      loadedMessage: 'Loaded',
      paginator,
      reload: vi.fn(() => reload.promise),
    };
    const { rerender, result } = renderRetry(params);

    act(() => result.current.retry());
    const retryError = new Error('retry failed');
    paginator.lastQueryError = retryError;
    rerender({ ...params, firstPageLoadError: retryError });
    await act(async () => {
      reload.resolve();
      await reload.promise;
    });

    expect(mockAnnounce).not.toHaveBeenCalled();
    expect(result.current).toMatchObject({ error: retryError, isRetrying: false });
  });

  it('announces nothing while a newer query that replaced the retry loads', async () => {
    const error = new Error('first page failed');
    const paginator: Paginator = { isLoading: false, lastQueryError: error };
    const reload = deferred();
    const params = {
      firstPageLoadError: error,
      loadedMessage: 'Loaded',
      paginator,
      reload: vi.fn(() => reload.promise),
    };
    const { result } = renderRetry(params);

    act(() => result.current.retry());
    // A typed search query aborts the retry: its error is cleared and it loads.
    paginator.isLoading = true;
    paginator.lastQueryError = undefined;
    await act(async () => {
      reload.resolve();
      await reload.promise;
    });

    expect(mockAnnounce).not.toHaveBeenCalled();
  });

  it('starts one retry at a time', () => {
    const reload = vi.fn(() => new Promise<void>(() => undefined));
    const { result } = renderRetry({
      firstPageLoadError: new Error('first page failed'),
      loadedMessage: 'Loaded',
      paginator: { isLoading: false, lastQueryError: new Error('first page failed') },
      reload,
    });

    act(() => {
      result.current.retry();
      result.current.retry();
    });

    expect(reload).toHaveBeenCalledTimes(1);
  });

  it('shows another paginator’s own state, and announces nothing for the old retry', async () => {
    const errorA = new Error('A failed');
    const errorB = new Error('B failed');
    const paginatorA: Paginator = { isLoading: false, lastQueryError: errorA };
    const paginatorB: Paginator = { isLoading: false, lastQueryError: errorB };
    const reloadA = deferred();
    const reloadB = vi.fn(() => new Promise<void>(() => undefined));
    const { rerender, result } = renderRetry({
      firstPageLoadError: errorA,
      loadedMessage: 'Loaded',
      paginator: paginatorA,
      reload: () => reloadA.promise,
    });

    act(() => result.current.retry());
    rerender({
      firstPageLoadError: errorB,
      loadedMessage: 'Loaded',
      paginator: paginatorB,
      reload: reloadB,
    });

    expect(result.current).toMatchObject({ error: errorB, isRetrying: false });
    act(() => result.current.retry());
    expect(reloadB).toHaveBeenCalledTimes(1);

    paginatorA.lastQueryError = undefined;
    await act(async () => {
      reloadA.resolve();
      await reloadA.promise;
    });

    expect(mockAnnounce).not.toHaveBeenCalled();
    expect(result.current).toMatchObject({ error: errorB, isRetrying: true });
  });
});
