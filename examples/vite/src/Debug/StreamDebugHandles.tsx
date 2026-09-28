import { useEffect } from 'react';
import { useChatContext } from 'stream-chat-react';

import { listComposers } from './composerRegistry';

/**
 * Publishes live debug handles on `window.streamDebug`, so the console can reach the client,
 * the channels, the composers and the upload records without walking the React fiber tree to
 * find them.
 *
 * Every entry is a **getter**, so what you read in the console is the current value rather than
 * a snapshot taken when the component last rendered.
 *
 *   streamDebug.client            // StreamChat
 *   streamDebug.channels          // client.activeChannels, keyed by cid
 *   streamDebug.composers         // [{ tag, label, composer }] incl. thread/edit composers
 *   streamDebug.uploads           // client.uploadManager.uploads, keyed by localMetadata.id
 *
 * The v14 version also exposed singular `channel` / `composer` / `attachments` / `messages`,
 * reading the active channel off `ChatContext`. v15 removed it — a `Channel` is addressed by
 * instance, not looked up from the client — and this component mounts under `<Chat>`, not under
 * a `<Channel>`, so there is no channel in scope to read. Rather than invent one, the handles are
 * plural: pick the channel you want out of `channels` and go from there, e.g.
 *
 *   streamDebug.channels['messaging:foo'].messageComposer.attachmentManager.attachments
 *
 * Renders nothing. Mount it once, anywhere under <Chat>.
 */
export const StreamDebugHandles = () => {
  const { client } = useChatContext();

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handles = {
      get channels() {
        return client?.activeChannels;
      },
      get client() {
        return client;
      },
      get composers() {
        return listComposers(client);
      },
      get uploads() {
        return client?.uploadManager?.uploads;
      },
    };

    (window as unknown as Record<string, unknown>).streamDebug = handles;

    return () => {
      delete (window as unknown as Record<string, unknown>).streamDebug;
    };
  }, [client]);

  return null;
};
