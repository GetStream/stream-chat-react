// Import the root barrel first so the module graph initialises in the same order as in the app
// (see the note in MessageInput.test.tsx).
import '../../..';
import React, { useEffect } from 'react';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { fromPartial } from '@total-typescript/shoehorn';

import { Channel } from '../../Channel/Channel';
import { MessageComposerContextProvider } from '../../../context';
import { Chat } from '../../Chat';
import type { MessageComposerContextValue } from '../../../context';
import {
  useDragAndDropUploadContext,
  WithDragAndDropUpload,
} from '../WithDragAndDropUpload';
import { initClientWithChannels } from '../../../mock-builders';

const dropFile = (file: File, element: Element) =>
  fireEvent.drop(element, {
    dataTransfer: { files: [file], types: ['Files'] },
  });

const file = () => new File(['content'], 'note.txt', { type: 'text/plain' });

/** Stands in for the MessageComposerProvider, which is what registers drop handlers in the app. */
const DropSubscriber = ({ onDrop }: { onDrop: (files: File[]) => void }) => {
  const { subscribeToDrop } = useDragAndDropUploadContext();

  useEffect(() => subscribeToDrop?.(onDrop), [onDrop, subscribeToDrop]);

  return <div data-testid='subscriber' />;
};

const setup = async () => {
  const {
    channels: [channel],
    client,
  } = await initClientWithChannels({
    // the dropzone is disabled in direct mode unless uploads are permitted
    channelsData: [{ channel: { own_capabilities: ['upload-file'] } }],
  });
  const uploadFiles = vi
    .spyOn(channel.messageComposer.attachmentManager, 'uploadFiles')
    .mockResolvedValue(undefined);

  return { channel, client, queuedHandler: vi.fn(), uploadFiles };
};

const dropOnRoot = async () => {
  const dropped = file();
  // async act: the direct-mode onDrop (attachmentManager.uploadFiles) returns a promise
  await act(async () => {
    await dropFile(dropped, screen.getByTestId('subscriber').parentElement!);
  });
  return dropped;
};

describe('WithDragAndDropUpload', () => {
  it('uploads straight to the surrounding composer when rendered within MessageComposerContextProvider', async () => {
    const { channel, client, queuedHandler, uploadFiles } = await setup();

    await act(async () => {
      await render(
        <Chat client={client}>
          <Channel channel={channel}>
            <MessageComposerContextProvider
              value={fromPartial<MessageComposerContextValue>({})}
            >
              <WithDragAndDropUpload>
                <DropSubscriber onDrop={queuedHandler} />
              </WithDragAndDropUpload>
            </MessageComposerContextProvider>
          </Channel>
        </Chat>,
      );
    });

    const dropped = await dropOnRoot();

    // react-dropzone invokes onDrop as (acceptedFiles, fileRejections, event)
    expect(uploadFiles).toHaveBeenCalledTimes(1);
    expect(uploadFiles.mock.calls[0][0]).toEqual([dropped]);
    expect(queuedHandler).not.toHaveBeenCalled();
  });

  it('fans drops out to subscribed composers when rendered outside MessageComposerContextProvider', async () => {
    const { channel, client, queuedHandler, uploadFiles } = await setup();

    await act(async () => {
      await render(
        <Chat client={client}>
          <Channel channel={channel}>
            <WithDragAndDropUpload>
              <DropSubscriber onDrop={queuedHandler} />
            </WithDragAndDropUpload>
          </Channel>
        </Chat>,
      );
    });

    const dropped = await dropOnRoot();

    expect(queuedHandler).toHaveBeenCalledWith([dropped]);
    expect(uploadFiles).not.toHaveBeenCalled();
  });
});
