import { renderHook } from '@testing-library/react';

import type { SearchSource } from 'stream-chat';
import { useAnnounceSearchResultCount } from '../hooks/useAnnounceSearchResultCount';
import { useInteractionAnnouncements } from '../../Accessibility';

vi.mock('../../Accessibility');

const makeContainer = (optionCount: number) => {
  const container = document.createElement('div');
  for (let i = 0; i < optionCount; i++) {
    const option = document.createElement('button');
    option.setAttribute('role', 'option');
    container.appendChild(option);
  }
  document.body.appendChild(container);
  return container;
};

const makeSource = (hasNext: boolean, isLoading = false) =>
  ({
    state: { getLatestValue: () => ({ hasNext, isLoading }) },
  }) as unknown as SearchSource;

describe('useAnnounceSearchResultCount', () => {
  const announceInteraction = vi.fn();
  const cancelInteraction = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useInteractionAnnouncements).mockReturnValue({
      announceInteraction,
      cancelInteraction,
    });
  });

  afterEach(() => {
    document.body.innerHTML = '';
  });

  it('announces the rendered option count via the search.resultCount interaction', () => {
    const container = makeContainer(3);
    renderHook(() => useAnnounceSearchResultCount({ current: container }, true));

    expect(announceInteraction).toHaveBeenCalledWith('search.resultCount', {
      allResultsLoaded: false,
      count: 3,
    });
  });

  it('announces a zero count (empty results) too', () => {
    const container = makeContainer(0);
    renderHook(() => useAnnounceSearchResultCount({ current: container }, true));

    expect(announceInteraction).toHaveBeenCalledWith('search.resultCount', {
      allResultsLoaded: false,
      count: 0,
    });
  });

  it('reports allResultsLoaded when every active source is fully loaded', () => {
    const container = makeContainer(3);
    renderHook(() =>
      useAnnounceSearchResultCount({ current: container }, true, [
        makeSource(false),
        makeSource(false),
      ]),
    );

    expect(announceInteraction).toHaveBeenCalledWith('search.resultCount', {
      allResultsLoaded: true,
      count: 3,
    });
  });

  it('does not report allResultsLoaded while any source still has a next page or is loading', () => {
    const container = makeContainer(3);
    renderHook(() =>
      useAnnounceSearchResultCount({ current: container }, true, [
        makeSource(false),
        makeSource(true), // still has more
      ]),
    );

    expect(announceInteraction).toHaveBeenCalledWith('search.resultCount', {
      allResultsLoaded: false,
      count: 3,
    });
  });

  it('does not announce while inactive (presearch)', () => {
    const container = makeContainer(3);
    renderHook(() => useAnnounceSearchResultCount({ current: container }, false));

    expect(announceInteraction).not.toHaveBeenCalled();
  });

  it('cancels the pending count when search becomes inactive (results unmount)', () => {
    const container = makeContainer(3);
    const { rerender } = renderHook(
      ({ active }) => useAnnounceSearchResultCount({ current: container }, active),
      { initialProps: { active: true } },
    );

    rerender({ active: false });
    expect(cancelInteraction).toHaveBeenCalledWith('search.resultCount');
  });
});
