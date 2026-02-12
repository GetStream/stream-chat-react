import type { MouseEventHandler } from 'react';
import React from 'react';
import { useTranslationContext } from '../../context/TranslationContext';
import { useChannelStateContext, useComponentContext } from '../../context';
import { AvatarStack as DefaultAvatarStack } from '../Avatar';

export type MessageRepliesCountButtonProps = {
  /* If supplied, adds custom text to the end of a multiple replies message */
  labelPlural?: string;
  /* If supplied, adds custom text to the end of a single reply message */
  labelSingle?: string;
  /* Function to navigate into an existing thread on a message */
  onClick?: MouseEventHandler;
  /* The amount of replies (i.e., threaded messages) on a message */
  reply_count?: number;
};

function UnMemoizedMessageRepliesCountButton(props: MessageRepliesCountButtonProps) {
  const { AvatarStack = DefaultAvatarStack } = useComponentContext(
    MessageRepliesCountButton.name,
  );
  const { labelPlural, labelSingle, onClick, reply_count = 0 } = props;
  const { channelCapabilities } = useChannelStateContext();

  const { t } = useTranslationContext('MessageRepliesCountButton');

  if (!reply_count) return null;

  let replyCountText = t('replyCount', { count: reply_count });

  if (labelPlural && reply_count > 1) {
    replyCountText = `${reply_count} ${labelPlural}`;
  } else if (labelSingle) {
    replyCountText = `1 ${labelSingle}`;
  }

  return (
    <div className='str-chat__message-replies-count-button-wrapper'>
      <button
        className='str-chat__message-replies-count-button'
        data-testid='replies-count-button'
        disabled={!channelCapabilities['send-reply']}
        onClick={onClick}
      >
        {replyCountText}

        <AvatarStack
          // TODO: figure out place to get this type of data
          displayInfo={[
            {
              id: '0',
              imageUrl: 'https://getstream.io/random_png?id=mark&name=Mark',
              userName: 'Mark',
            },
            {
              id: '1',
              imageUrl: 'https://getstream.io/random_png?id=jane&name=Jane',
              userName: 'Jane',
            },
          ]}
        />
      </button>
    </div>
  );
}

export const MessageRepliesCountButton = React.memo(
  UnMemoizedMessageRepliesCountButton,
) as typeof UnMemoizedMessageRepliesCountButton;
