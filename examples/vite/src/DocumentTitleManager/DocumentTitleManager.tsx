import { useEffect } from 'react';
import type { StreamChat, ThreadManagerState } from 'stream-chat';

import { useTotalUnreadChannelMessageCount } from './useTotalUnreadChannelMessageCount';
import { useChatContext, useStateStore } from 'stream-chat-react';

export type FormatDocumentTitleParams = {
  /**
   * The connected client, for a title built from something other than the plain total -- thread
   * unread (`client.threads.state`), a specific channel, whatever the application tracks.
   */
  client: StreamChat;
  /**
   * How many **channel messages** the user has not read, across every channel (the server's
   * `total_unread_count`). A count of messages.
   */
  totalUnreadChannelMessageCount: number;
  /**
   * How many **threads** the user has unread replies in (`client.threads`' `unreadThreadCount`).
   * A count of threads, not of messages -- these two are different units and adding them together
   * produces a number that means nothing. Show them side by side instead.
   */
  totalUnreadThreadCount: number;
};

export type FormatDocumentTitle = (params: FormatDocumentTitleParams) => string;

export type DocumentTitleManagerProps = {
  /**
   * Builds the whole document title, for every state -- including when nothing is unread.
   *
   * Required, because there is no sensible default: the title an application wants is its own, and
   * reading `document.title` to guess at it is a trap. Whatever is there when this mounts may be a
   * loading placeholder, a title set by a router, or a title that already carries a count from a
   * server-rendered page -- and after the first write it is this component's own last output, so
   * building on it would nest one count inside the next.
   *
   * Called again whenever either count changes. A title built from other reactive state -- some-
   * thing on a channel, say -- will not recompute on its own; subscribe to it in your own
   * component and render that instead.
   */
  formatTitle: FormatDocumentTitle;
};

const totalUnreadThreadCountSelector = ({ unreadThreadCount }: ThreadManagerState) => ({
  totalUnreadThreadCount: unreadThreadCount,
});

/**
 * Owns `document.title` for as long as it is mounted, rebuilding it whenever the user's unread
 * counts change. Renders nothing.
 *
 * Application code, not SDK code, and deliberately so: what belongs in a tab title depends on what
 * the application is showing. This component knows the unread counts but not whether the user is
 * looking at the channel those unreads are in, so only the application can decide what the title
 * should say. Copy it, change it, or drop it.
 *
 * Out of the box it prefixes the page's title with the unread message count -- `(3) Your app` --
 * but that is only the default `formatTitle`. The component's job is the title, not the count: a
 * `formatTitle` is free to ignore both counts and build the title from anything on the `client`.
 *
 * Opt in by rendering it inside `Chat` -- there is no override to disable, because an application
 * that does not want its title touched simply does not render it, and one that wants different
 * behavior renders its own component instead:
 *
 * ```tsx
 * <Chat client={client}>
 *   <DocumentTitleManager
 *     formatTitle={({ totalUnreadChannelMessageCount: unread }) =>
 *       unread > 0 ? `(${unread}) Your app` : 'Your app'
 *     }
 *   />
 *   …
 * </Chat>
 * ```
 *
 * It lives here rather than inside `Channel` on purpose. The count belongs to the user, not to
 * whichever channel happens to be open: a `Channel`-scoped version shows nothing while the user is
 * in a threads view, keeps counting only the open channel while messages arrive elsewhere, and
 * leaves a stale number behind after a channel switch.
 */
export const DocumentTitleManager = ({ formatTitle }: DocumentTitleManagerProps) => {
  const { client } = useChatContext();
  const totalUnreadChannelMessageCount = useTotalUnreadChannelMessageCount(client);
  const { totalUnreadThreadCount } = useStateStore(
    client.threads.state,
    totalUnreadThreadCountSelector,
  );
  // Captured for one purpose: putting the page back the way it was found. It is deliberately not
  // offered to `formatTitle` as something to build on -- what happens to be in the title when this
  // mounts is an accident of timing, not the application's base title.
  useEffect(() => {
    const titleBeforeMount = document.title;

    return () => {
      document.title = titleBeforeMount;
    };
  }, []);

  useEffect(() => {
    document.title = formatTitle({
      client,
      totalUnreadChannelMessageCount,
      totalUnreadThreadCount,
    });
  }, [client, formatTitle, totalUnreadChannelMessageCount, totalUnreadThreadCount]);

  return null;
};
