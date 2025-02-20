import { nanoid } from 'nanoid';
import type { OGAttachment, UserResponse } from 'stream-chat';
import type { StreamMessage } from '../../../../context';
import { LinkPreviewMap, LinkPreviewState, type LocalAttachment } from '../../types';
import type { DefaultStreamChatGenerics } from '../../../../types';

export type MessageInputState<
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
> = {
  attachments: LocalAttachment<StreamChatGenerics>[];
  linkPreviews: LinkPreviewMap;
  mentioned_users: UserResponse<StreamChatGenerics>[];
  text: string;
  lastChange?: Date;
};

export const makeEmptyMessageInputState = <
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
>(): MessageInputState<StreamChatGenerics> => ({
  attachments: [],
  lastChange: undefined,
  linkPreviews: new Map(),
  mentioned_users: [],
  text: '',
});

/**
 * Initializes the state. Empty if the message prop is falsy.
 */
export const initState = <
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
>(
  message?: Pick<
    StreamMessage<StreamChatGenerics>,
    'attachments' | 'mentioned_users' | 'text'
  >,
): MessageInputState<StreamChatGenerics> => {
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
          }) as LocalAttachment<StreamChatGenerics>,
      ) || [];

  const mentioned_users: StreamMessage['mentioned_users'] = message.mentioned_users || [];

  return {
    attachments,
    lastChange: undefined,
    linkPreviews,
    mentioned_users,
    text: message.text || '',
  };
};
