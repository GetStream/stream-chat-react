// Import the package barrel first so it evaluates in its natural order — see AttachmentSelector.test.tsx.
import '../../../..';
import React from 'react';
import { act, render, screen } from '@testing-library/react';
import { Chat } from '../../../Chat';
import { Channel } from '../../../Channel';
import { initClientWithChannels } from '../../../../mock-builders';
import { useChannelConfig } from '../useChannelConfig';

/**
 * The hook used to read the channel *type's* raw server configuration. It now returns the channel's
 * resolved configuration, which is that server answer already ANDed with whatever the integrator
 * registered — so these assert the half that used to be missing.
 */
const Probe = ({ cid }: { cid: string | undefined }) => {
  const config = useChannelConfig({ cid });
  return <div data-testid='probe'>{JSON.stringify(config?.typingEvents ?? null)}</div>;
};

describe('useChannelConfig', () => {
  const setup = async (serverConfig: Record<string, unknown>) => {
    const {
      channels: [channel],
      client,
    } = await initClientWithChannels({
      channelsData: [
        {
          channel: {
            cid: 'messaging:id',
            config: serverConfig,
            id: 'id',
            type: 'messaging',
          },
        },
      ],
    });
    return { channel, client };
  };

  const renderProbe = (client: never, channel: never, cid?: string) => {
    act(() => {
      render(
        <Chat client={client}>
          <Channel channel={channel}>
            <Probe cid={cid ?? channel.cid} />
          </Channel>
        </Chat>,
      );
    });
  };

  it('reflects the client-side gate the raw server flag could not express', async () => {
    const { channel, client } = await setup({ typing_events: true });
    client.config.set({ channel: { typingEvents: { enabled: false } } });

    renderProbe(client as never, channel as never);

    expect(screen.getByTestId('probe')).toHaveTextContent('{"enabled":false}');
  });

  it('still lets the server veto win', async () => {
    const { channel, client } = await setup({ typing_events: false });
    client.config.set({ channel: { typingEvents: { enabled: true } } });

    renderProbe(client as never, channel as never);

    expect(screen.getByTestId('probe')).toHaveTextContent('{"enabled":false}');
  });

  it('re-renders when the configuration changes', async () => {
    const { channel, client } = await setup({ typing_events: true });
    renderProbe(client as never, channel as never);
    expect(screen.getByTestId('probe')).toHaveTextContent('{"enabled":true}');

    act(() => {
      client.config.set({ channel: { typingEvents: { enabled: false } } });
    });

    expect(screen.getByTestId('probe')).toHaveTextContent('{"enabled":false}');
  });

  it('returns undefined for a cid that is not the channel in context', async () => {
    const { channel, client } = await setup({ typing_events: true });

    renderProbe(client as never, channel as never, 'messaging:other');

    expect(screen.getByTestId('probe')).toHaveTextContent('null');
  });
});
