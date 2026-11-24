import React from 'react';
import { renderHook } from '@testing-library/react';
import { fromPartial } from '@total-typescript/shoehorn';
import type { Channel } from 'stream-chat';

import { ChannelInstanceProvider } from '../ChannelInstanceContext';
import { useContextChannel, useResolvedChannel } from '../useContextChannel';

const contextChannel = fromPartial<Channel>({ cid: 'messaging:context' });
const givenChannel = fromPartial<Channel>({ cid: 'messaging:given' });

const withChannel = ({ children }: React.PropsWithChildren) => (
  <ChannelInstanceProvider value={{ channel: contextChannel }}>
    {children}
  </ChannelInstanceProvider>
);

describe('useContextChannel', () => {
  it('is undefined outside a channel provider', () => {
    expect(renderHook(() => useContextChannel()).result.current).toBeUndefined();
  });

  it('reads the channel in context', () => {
    const { result } = renderHook(() => useContextChannel(), { wrapper: withChannel });

    expect(result.current).toBe(contextChannel);
  });
});

describe('useResolvedChannel', () => {
  it('prefers the given channel', () => {
    const { result } = renderHook(() => useResolvedChannel(givenChannel), {
      wrapper: withChannel,
    });

    expect(result.current).toBe(givenChannel);
  });

  it('falls back to the channel in context', () => {
    const { result } = renderHook(() => useResolvedChannel(), { wrapper: withChannel });

    expect(result.current).toBe(contextChannel);
  });

  it('throws without a given channel or one in context', () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined);

    expect(() => renderHook(() => useResolvedChannel())).toThrow(
      'Could not resolve a channel',
    );
  });
});
