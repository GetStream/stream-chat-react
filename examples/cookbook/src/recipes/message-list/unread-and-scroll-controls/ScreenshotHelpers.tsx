import { useEffect } from 'react';
import type { Event, MessageResponse } from 'stream-chat';
import { msToNs } from 'stream-chat';
import { useChatContext } from 'stream-chat-react';
import { useClickInTurn } from '../../../base/useClickInTurn';
import demoData from './demo-data.json';

// The seed leaves this channel unread from one message on (`unreadFrom` in demo-data.json).
const UNREAD_CHANNEL_ID = demoData.channels[0].id;
const params = new URLSearchParams(window.location.search);
// Set once the list's mark-read on open has reached the read state, so the helpers below act on
// the channel as the user would find it.
let readOnOpen = false;

/**
 * For the screenshots only, not part of the recipe. The list marks a channel read as it opens at
 * the latest message, which would end the seeded unread state for every later visitor. For this
 * channel, a `markReadRequest` handler marks it read on this device only, so the list behaves as it
 * would and the server keeps the channel unread. Every other channel is marked read as usual.
 */
const MarkDemoChannelReadLocally = () => {
  const { client } = useChatContext();

  useEffect(() => {
    client.config.set({
      channel: {
        requestHandlers: {
          markReadRequest: async ({ channel, options }) => {
            if (channel.id !== UNREAD_CHANNEL_ID) return await channel.markRead(options);
            // Waits as long as a request would. `Channel` takes the unread snapshot in an effect
            // that runs after the list's first mark-read, so a read applied at once would reach
            // the snapshot and hide the separator.
            await new Promise((resolve) => setTimeout(resolve, 300));
            channel.markReadLocally();
            readOnOpen = true;
            return null;
          },
        },
      },
    });
    return () => {
      client.config.set({ channel: { requestHandlers: { markReadRequest: undefined } } });
    };
  }, [client]);

  return null;
};

const findJumpButton = () =>
  readOnOpen
    ? document.querySelector<HTMLElement>(
        '.str-chat__unread-messages-notification button, .cookbook-unread-banner__jump',
      )
    : null;

// `?jump=unread` clicks the banner's jump button once it shows, as the user would.
const jumpSteps = params.get('jump') === 'unread' ? [{ find: findJumpButton }] : [];

const arrivingMessages = [
  { text: 'Running shoes or trail shoes for the lake path?', user: 'docs-v15-ck-dan' },
  { text: 'Running shoes are fine, the path is paved.', user: 'docs-v15-ck-cara' },
];

/**
 * `&arrive=<n>`: once the list has jumped (the banner is gone and the scroll-to-latest button has
 * shown for a second), the list scrolls further up and `n` messages from the others arrive in the
 * channel. They are `message.new` events dispatched on this client only,
 * as if the server had sent them; nothing is sent, and reloading the page drops them.
 */
const ArriveWhileScrolledUp = () => {
  const { client } = useChatContext();

  useEffect(() => {
    const count = Number(params.get('arrive') ?? 0);
    if (!count) return;

    const channel = client.channel('messaging', UNREAD_CHANNEL_ID);
    let settledTicks = 0;
    const timer = setInterval(() => {
      const { members } = channel.state.getLatestValue();
      const jumped =
        !findJumpButton() &&
        !!document.querySelector('.str-chat__jump-to-latest-message');
      settledTicks = jumped ? settledTicks + 1 : 0;
      if (settledTicks < 5) return;
      clearInterval(timer);

      // Scrolls further up, past the separator, as a user reading older messages would.
      document.querySelector('.str-chat__message-list-scroll')?.scrollBy({ top: -400 });

      arrivingMessages.slice(0, count).forEach(({ text, user: userId }, index) => {
        const user = members[userId]?.user;
        if (!user) return;
        const createdAt = msToNs(Date.now() + index);
        const message: MessageResponse = {
          attachments: [],
          cid: channel.cid,
          created_at: createdAt,
          custom: {},
          deleted_reply_count: 0,
          html: '',
          id: `cookbook-local-arrival-${index + 1}`,
          latest_reactions: [],
          mentioned_channel: false,
          mentioned_here: false,
          mentioned_users: [],
          own_reactions: [],
          pinned: false,
          reaction_counts: {},
          reaction_scores: {},
          reply_count: 0,
          restricted_visibility: [],
          shadowed: false,
          silent: false,
          text,
          type: 'regular',
          updated_at: createdAt,
          user,
        };
        const event = {
          channel_id: channel.id,
          channel_type: channel.type,
          cid: channel.cid,
          created_at: createdAt,
          message,
          type: 'message.new',
          user,
        } as Event;
        client.dispatchEvent(event);
      });
    }, 200);

    return () => clearInterval(timer);
  }, [client]);

  return null;
};

const JumpToUnreadFromUrl = () => {
  useClickInTurn(jumpSteps);
  return null;
};

export const UnreadScreenshotHelpers = () => (
  <>
    <MarkDemoChannelReadLocally />
    <JumpToUnreadFromUrl />
    <ArriveWhileScrolledUp />
  </>
);
