import { useEffect } from 'react';
import type { MessageResponse } from 'stream-chat';
import { formatMessage, msToNs, nsToMs } from 'stream-chat';
import { useChatContext } from 'stream-chat-react';
import { catalogue } from './catalogue';
import { toProductAttachment } from './product';

/**
 * For the screenshots only, not part of the recipe. In the channel `?channel=` on this device,
 * without sending anything:
 * - `?menu=open` opens the attachment menu, and `?menu=picker` the product picker from it.
 * - `?product=<id>` adds that catalogue product to the composer.
 * - `?quote=<message id>` quotes that message in the composer.
 * - `?reply=<message id>` adds a reply from Cleo quoting that message to the list, as if it had
 *   been sent. The seed can't send quoted replies; reloading the page drops it.
 */

const clickWhenVisible = (selector: string, then?: () => void) => {
  const timer = setInterval(() => {
    const element = document.querySelector<HTMLElement>(selector);
    if (!element) return;
    clearInterval(timer);
    element.click();
    then?.();
  }, 200);
  return () => clearInterval(timer);
};

const MENU_BUTTON = '.str-chat__channel .str-chat__attachment-selector__menu-button';
const ATTACH_PRODUCT_ITEM = '.cookbook-attach-product-button';

export const DemoProductShots = () => {
  const { client } = useChatContext();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const channelId = params.get('channel');
    if (!channelId) return;
    const menu = params.get('menu');
    const product = catalogue.find(({ id }) => id === params.get('product'));
    const quoteId = params.get('quote');
    const replyId = params.get('reply');
    const channel = client.channel('messaging', channelId);
    const stops: Array<() => void> = [];

    // Waits for the channel's first page and for its composer, which resets its state while it sets up.
    const timer = setInterval(() => {
      const items = channel.messagePaginator.items;
      if (!items?.length || !document.querySelector('.str-chat__channel textarea'))
        return;
      clearInterval(timer);

      if (menu) {
        stops.push(
          clickWhenVisible(MENU_BUTTON, () => {
            if (menu === 'picker') stops.push(clickWhenVisible(ATTACH_PRODUCT_ITEM));
          }),
        );
      }

      if (product) {
        channel.messageComposer.attachmentManager.upsertAttachments([
          toProductAttachment(product),
        ]);
      }

      const quoted = quoteId ? channel.messagePaginator.getItem(quoteId) : undefined;
      if (quoted) channel.messageComposer.setQuotedMessage(quoted);

      const replied = replyId ? channel.messagePaginator.getItem(replyId) : undefined;
      const author = channel.state.getLatestValue().members[client.userId ?? '']?.user;
      if (replied && author) {
        const newest = Math.max(...items.map((item) => item.created_at));
        // A minute after the newest message, so it lands at the end of the list.
        const createdAt = msToNs(nsToMs(newest) + 60_000);
        const reply: MessageResponse = {
          attachments: [],
          cid: channel.cid,
          created_at: createdAt,
          custom: {},
          deleted_reply_count: 0,
          html: '',
          id: 'cookbook-local-product-reply',
          latest_reactions: [],
          mentioned_channel: false,
          mentioned_here: false,
          mentioned_users: [],
          own_reactions: [],
          pinned: false,
          quoted_message: replied as unknown as MessageResponse,
          quoted_message_id: replied.id,
          reaction_counts: {},
          reaction_scores: {},
          reply_count: 0,
          restricted_visibility: [],
          shadowed: false,
          silent: false,
          text: 'Perfect, that one fits the shelf.',
          type: 'regular',
          updated_at: createdAt,
          user: author,
        };
        channel.messagePaginator.ingestItem(formatMessage(reply));
      }
    }, 200);
    stops.push(() => clearInterval(timer));

    return () => stops.forEach((stop) => stop());
  }, [client]);

  return null;
};
