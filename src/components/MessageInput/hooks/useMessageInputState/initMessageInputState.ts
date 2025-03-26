import { nanoid } from 'nanoid';
import type { LocalMessage, OGAttachment, UserResponse } from 'stream-chat';
import type { LinkPreviewMap } from '../../types';
import { LinkPreviewState, type LocalAttachment } from '../../types';

export type MessageInputState = {
  attachments: LocalAttachment[];
  linkPreviews: LinkPreviewMap;
  mentioned_users: UserResponse[];
  text: string;
  lastChange?: Date;
};

export const makeEmptyMessageInputState = (): MessageInputState => ({
  attachments: [],
  lastChange: undefined,
  linkPreviews: new Map(),
  mentioned_users: [],
  text: '',
});

/**
 * Initializes the state. Empty if the message prop is falsy.
 */
export const initState = (
  message?: Pick<LocalMessage, 'attachments' | 'mentioned_users' | 'text'>,
): MessageInputState => {
  if (!message) {
    return makeEmptyMessageInputState();
  }

  const linkPreviews =
    message.attachments?.reduce<LinkPreviewMap>((acc, attachment) => {
      if (!attachment.og_scrape_url) return acc;
      acc.set(attachment.og_scrape_url, {
        ...(attachment as OGAttachment),
        state: LinkPreviewState.LOADED,
      });
      return acc;
    }, new Map()) ?? new Map();

  const attachments =
    message.attachments
      ?.filter(({ og_scrape_url }) => !og_scrape_url)
      .map(
        (att) =>
          ({
            ...att,
            localMetadata: { id: nanoid() },
          }) as LocalAttachment,
      ) || [];

  const mentioned_users: LocalMessage['mentioned_users'] = message.mentioned_users || [];

  return {
    attachments,
    lastChange: undefined,
    linkPreviews,
    mentioned_users,
    text: message.text || '',
  };
};
