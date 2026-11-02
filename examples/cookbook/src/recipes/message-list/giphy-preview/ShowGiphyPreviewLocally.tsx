import { useEffect } from 'react';
import type { MessageResponse } from 'stream-chat';
import { formatMessage, nowNs } from 'stream-chat';
import { useChannel, useChatContext } from 'stream-chat-react';

const PREVIEW_IMAGE = 'https://picsum.photos/id/10/480/360';
// The one still image stands in for every size Giphy would send.
const PREVIEW_RENDITION = {
  frames: '1',
  height: '200',
  size: '',
  url: PREVIEW_IMAGE,
  width: '267',
};

/**
 * For the screenshots only, not part of the recipe: `?giphy=preview` adds a Giphy preview to the
 * channel's paginator, as the server's answer to `/giphy forest` would. The cookbook is read-only,
 * so `/giphy` can't be sent; the preview exists on this device only, and its buttons send nothing.
 * The "GIF" is a still photo.
 */
export const ShowGiphyPreviewLocally = () => {
  const { client } = useChatContext();
  const channel = useChannel();

  useEffect(() => {
    if (new URLSearchParams(window.location.search).get('giphy') !== 'preview') return;
    // The members' entries carry the full user, as the server's answer would.
    const userId = client.user?.id;
    if (!userId) return;

    const addPreview = () => {
      const user = channel.state.getLatestValue().members[userId]?.user;
      if (!user) return;
      // Wire timestamps are nanosecond numbers; `nowNs()` puts the preview after the latest message.
      const now = nowNs();
      const preview: MessageResponse = {
        attachments: [
          {
            actions: [
              {
                name: 'image_action',
                style: 'primary',
                text: 'Send',
                type: 'button',
                value: 'send',
              },
              {
                name: 'image_action',
                style: 'default',
                text: 'Shuffle',
                type: 'button',
                value: 'shuffle',
              },
              {
                name: 'image_action',
                style: 'default',
                text: 'Cancel',
                type: 'button',
                value: 'cancel',
              },
            ],
            custom: {},
            giphy: {
              fixed_height: PREVIEW_RENDITION,
              fixed_height_downsampled: PREVIEW_RENDITION,
              fixed_height_still: PREVIEW_RENDITION,
              fixed_width: PREVIEW_RENDITION,
              fixed_width_downsampled: PREVIEW_RENDITION,
              fixed_width_still: PREVIEW_RENDITION,
              original: PREVIEW_RENDITION,
            },
            thumb_url: PREVIEW_IMAGE,
            title: 'forest',
            type: 'giphy',
          },
        ],
        cid: channel.cid,
        command: 'giphy',
        created_at: now,
        custom: {},
        deleted_reply_count: 0,
        html: '',
        id: 'docs-v15-ck-trip-giphy-preview',
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
        text: '/giphy forest',
        type: 'ephemeral',
        updated_at: now,
        user,
      };
      channel.messagePaginator.ingestItem(formatMessage(preview));
    };

    // Waits for the first page, so the preview lands after the channel's latest message. The
    // store calls the handler at once with its current value.
    let added = false;
    const unsubscribe = channel.messagePaginator.state.subscribe(({ items }) => {
      if (added || !items?.length) return;
      added = true;
      addPreview();
    });
    return unsubscribe;
  }, [channel, client]);

  return null;
};
