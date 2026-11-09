import { act, renderHook } from '@testing-library/react';
import { ChannelPaginator } from 'stream-chat';

import { getTestClientWithUser } from '../../../../mock-builders';
import { useChannelPaginatorState } from '../useChannelPaginatorState';

describe('useChannelPaginatorState', () => {
  it('reports whether more channels exist at the head and at the tail of the list', async () => {
    const client = await getTestClientWithUser({ id: 'ann' });
    const paginator = new ChannelPaginator({ client, id: 'list' });
    const { result } = renderHook(() => useChannelPaginatorState(paginator));

    act(() => {
      paginator.state.partialNext({ hasMoreHead: true, hasMoreTail: false });
    });
    expect(result.current).toMatchObject({ hasMoreHead: true, hasMoreTail: false });

    act(() => {
      paginator.state.partialNext({ hasMoreHead: false, hasMoreTail: true });
    });
    expect(result.current).toMatchObject({ hasMoreHead: false, hasMoreTail: true });
  });
});
