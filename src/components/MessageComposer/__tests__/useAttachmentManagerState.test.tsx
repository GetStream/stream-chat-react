// Import the package barrel first so it evaluates in its natural order — see AttachmentSelector.test.tsx.
import '../../..';
import React from 'react';
import { act, render, screen } from '@testing-library/react';
import { Chat } from '../../Chat';
import { Channel } from '../../Channel';
import { initClientWithChannels } from '../../../mock-builders';
import { useAttachmentManagerState } from '../hooks/useAttachmentManagerState';

/**
 * A consumer that reads nothing but this hook.
 *
 * The isolation is the point. `isUploadEnabled` is a getter on the attachment manager, so nothing
 * re-renders when its configuration moves; the hook subscribes on the consumer's behalf. Asserting that
 * through `AttachmentSelector` would prove less than it appears to — that component holds several other
 * subscriptions that could mask a missing one. A component with nothing else subscribed is what actually
 * holds the hook to its contract, and it is the real situation too: `WithDragAndDropUpload` consumes
 * exactly this and nothing else.
 */
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
    // These have no getter on the attachment manager — they exist only on the resolved configuration,
    // which is why the hook selects them rather than reading them off the instance.
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
