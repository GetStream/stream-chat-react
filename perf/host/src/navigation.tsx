import { useEffect } from 'react';
import type { Channel, LocalMessage, Thread } from 'stream-chat';
import { useChatContext, useWorkspaceNavigation } from 'stream-chat-react';

// Lets window.__perf open and close channels through the SDK's own workspace navigation — the same
// `openChannel` a channel-list row calls on click — instead of synthesising a click.

type Navigation = {
  open: (cid: string) => void;
  close: (cid: string) => void;
  isOpen: (cid: string) => boolean;
  /** Opens the thread of `message` the way a "N replies" click does. */
  openThread: (cid: string, message: LocalMessage) => void;
  closeThread: () => void;
  /** The most recently opened thread, if any. */
  thread: () => Thread | undefined;
};

let navigation: Navigation | undefined;

export const getNavigation = () => {
  if (!navigation) throw new Error('navigation not ready: is the chat view mounted?');
  return navigation;
};

/** Mounted inside <ChatView>, where the workspace navigation exists. Renders nothing. */
export const NavigationBridge = () => {
  const nav = useWorkspaceNavigation();
  const { client } = useChatContext();

  useEffect(() => {
    const channelFor = (cid: string): Channel => {
      const loaded = client.channelManager.get(cid);
      if (loaded) return loaded;
      const [type, id] = cid.split(':');
      return client.channel(type, id);
    };
    navigation = {
      close: (cid) => nav.closeChannel(cid),
      isOpen: (cid) => nav.isChannelActive(cid),
      open: (cid) => nav.openChannel(channelFor(cid)),
      openThread: (cid, message) => nav.openThread({ channel: channelFor(cid), message }),
      closeThread: () => nav.closeThread(nav.openThreads.at(-1)?.id),
      thread: () => nav.openThreads.at(-1),
    };
    return () => {
      navigation = undefined;
    };
  }, [client, nav]);

  return null;
};
