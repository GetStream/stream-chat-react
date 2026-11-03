import { act, renderHook } from '@testing-library/react';

import { useFirstPageLoadRetry } from '../useFirstPageLoadRetry';
import type { UseFirstPageLoadRetryParams } from '../useFirstPageLoadRetry';

const mockAnnounce = vi.fn();

vi.mock('../../../Accessibility/useAriaLiveAnnouncer', () => ({
  useAriaLiveAnnouncer: () => mockAnnounce,
}));

type Paginator = { items: unknown[] | undefined };

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
    const paginator: Paginator = { items: undefined };
    const reload = deferred();
    const error = new Error('first page failed');
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

    paginator.items = [];
    await act(async () => {
      reload.resolve();
      await reload.promise;
    });

    expect(result.current).toMatchObject({ error: undefined, isRetrying: false });
    expect(mockAnnounce).toHaveBeenCalledWith('Loaded');
  });

  it('starts one retry at a time', () => {
    const reload = vi.fn(() => new Promise<void>(() => undefined));
    const { result } = renderRetry({
      firstPageLoadError: new Error('first page failed'),
      loadedMessage: 'Loaded',
      paginator: { items: undefined },
      reload,
    });

    act(() => {
      result.current.retry();
      result.current.retry();
    });

    expect(reload).toHaveBeenCalledTimes(1);
  });

  it('shows another paginator’s own state, and announces nothing for the old retry', async () => {
    const paginatorA: Paginator = { items: undefined };
    const paginatorB: Paginator = { items: undefined };
    const reloadA = deferred();
    const errorA = new Error('A failed');
    const errorB = new Error('B failed');
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

    paginatorA.items = [];
    await act(async () => {
      reloadA.resolve();
      await reloadA.promise;
    });

    expect(mockAnnounce).not.toHaveBeenCalled();
    expect(result.current).toMatchObject({ error: errorB, isRetrying: true });
  });
});
