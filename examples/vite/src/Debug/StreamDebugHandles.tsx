import { useEffect } from 'react';
import { useChatContext } from 'stream-chat-react';

import { listComposers } from './composerRegistry';

/**
 * Publishes live debug handles on `window.streamDebug`, so the console can reach the client,
 * the active channel, the composers and the upload records without walking the React fiber
 * tree to find them.
 *
 * Every entry is a **getter**, so what you read in the console is the current value rather than
 * a snapshot taken when the component last rendered.
 *
 *   streamDebug.client            // StreamChat
 *   streamDebug.channel           // active Channel
 *   streamDebug.composer          // the active channel's MessageComposer
 *   streamDebug.composers         // [{ tag, label, composer }] incl. thread/edit composers
 *   streamDebug.uploads           // client.uploadManager.uploads, keyed by localMetadata.id
 *   streamDebug.attachments       // the active composer's attachments
 *   streamDebug.messages          // channel.state.messages
 *
 * Renders nothing. Mount it once, anywhere under <Chat>.
 */
export const StreamDebugHandles = () => {
  const { channel, client } = useChatContext('StreamDebugHandles');

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handles = {
      get attachments() {
        return channel?.messageComposer?.attachmentManager.attachments;
      },
      get channel() {
        return channel;
      },
      get client() {
        return client;
      },
      get composer() {
        return channel?.messageComposer;
      },
      get composers() {
        return listComposers(client, channel);
      },
      get messages() {
        return channel?.state.messages;
      },
      get uploads() {
        return client?.uploadManager?.uploads;
      },
    };

    (window as unknown as Record<string, unknown>).streamDebug = handles;

    return () => {
      delete (window as unknown as Record<string, unknown>).streamDebug;
    };
  }, [channel, client]);

  return null;
};
