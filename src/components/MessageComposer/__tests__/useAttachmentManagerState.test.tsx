// Import the package barrel first so it evaluates in order (see AttachmentSelector.test.tsx).
import '../../..';
import React from 'react';
import { act, render, screen } from '@testing-library/react';
import { Chat } from '../../Chat';
import { Channel } from '../../Channel';
import { initClientWithChannels } from '../../../mock-builders';
import { useAttachmentManagerState } from '../hooks/useAttachmentManagerState';

// Reads nothing but the hook. `isUploadEnabled` is a getter on the attachment manager, so only the
// hook's own subscriptions re-render the consumer; `AttachmentSelector` holds other subscriptions
// that could mask a missing one.
const UploadProbe = () => {
  const { customCdn, isUploadEnabled, locationEnabled, pollsEnabled } =
    useAttachmentManagerState();
  return (
    <>
      <div data-testid='probe'>{isUploadEnabled ? 'enabled' : 'disabled'}</div>
      <div data-testid='flags'>
        {JSON.stringify({ customCdn, locationEnabled, pollsEnabled })}
      </div>
    </>
  );
};

const setup = async () => {
  const {
    channels: [channel],
    client,
  } = await initClientWithChannels({
    channelsData: [
      {
        channel: {
          cid: 'type:id',
          config: { polls: true, shared_locations: true, uploads: true },
          id: 'id',
          own_capabilities: ['upload-file'],
          type: 'type',
        },
      },
    ],
  });

  act(() => {
    render(
      <Chat client={client}>
        <Channel channel={channel}>
          <UploadProbe />
        </Channel>
      </Chat>,
    );
  });

  return { channel, client };
};

describe('useAttachmentManagerState', () => {
  it('re-renders when the composer configuration disables attachments', async () => {
    const { client } = await setup();
    expect(screen.getByTestId('probe')).toHaveTextContent('enabled');

    act(() => {
      client.config.set({ messageComposer: { attachments: { enabled: false } } });
    });

    expect(screen.getByTestId('probe')).toHaveTextContent('disabled');
  });

  it('exposes the composer-resolved location and poll gates, and the customCdn flag', async () => {
    // These have no getter on the attachment manager, so the hook selects them from the resolved
    // configuration.
    const { client } = await setup();
    expect(screen.getByTestId('flags')).toHaveTextContent(
      JSON.stringify({ customCdn: false, locationEnabled: true, pollsEnabled: true }),
    );

    act(() => {
      client.config.set({
        messageComposer: {
          attachments: { customCdn: true },
          location: { enabled: false },
          polls: { enabled: false },
        },
      });
    });

    expect(screen.getByTestId('flags')).toHaveTextContent(
      JSON.stringify({ customCdn: true, locationEnabled: false, pollsEnabled: false }),
    );
  });
});
