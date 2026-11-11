import { renderHook } from '@testing-library/react';
import type { Channel } from 'stream-chat';

import { useCreateChannelStateContext } from '../useCreateChannelStateContext';

const channel = {
  cid: 'messaging:general',
  data: { name: 'General' },
  initialized: false,
} as unknown as Channel;

const renderStateContext = (channelCapabilitiesArray: string[]) =>
  renderHook(
    ({ capabilities }) =>
      useCreateChannelStateContext({
        channel,
        channelCapabilitiesArray: capabilities,
        notifications: [],
      } as unknown as Parameters<typeof useCreateChannelStateContext>[0]),
    { initialProps: { capabilities: channelCapabilitiesArray } },
  );

describe('useCreateChannelStateContext', () => {
  it('maps the capabilities array to channelCapabilities', () => {
    const { result } = renderStateContext(['send-message', 'schedule-message']);

    expect(result.current.channelCapabilities).toEqual({
      'schedule-message': true,
      'send-message': true,
    });
  });

  it('updates channelCapabilities when only the capabilities change', () => {
    const { rerender, result } = renderStateContext(['send-message']);

    rerender({ capabilities: ['send-message', 'schedule-message'] });

    expect(result.current.channelCapabilities['schedule-message']).toBe(true);

    rerender({ capabilities: ['send-message'] });

    expect(result.current.channelCapabilities['schedule-message']).toBeUndefined();
  });

  it('keeps the same context when the capabilities only change order', () => {
    const { rerender, result } = renderStateContext(['send-message', 'schedule-message']);
    const firstContext = result.current;

    rerender({ capabilities: ['schedule-message', 'send-message'] });

    expect(result.current).toBe(firstContext);
  });
});
