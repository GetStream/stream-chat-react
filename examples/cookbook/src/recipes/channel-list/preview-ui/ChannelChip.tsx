import type { Channel, MessagePaginatorAggregateState } from 'stream-chat';
import {
  ChannelAvatar,
  useChannelPreviewInfo,
  useLatestMessagePreview,
  useStateStore,
  useWorkspaceNavigation,
} from 'stream-chat-react';
import './ChannelChip.css';

const latestMessageSelector = ({ latestMessage }: MessagePaginatorAggregateState) => ({
  latestMessage: latestMessage ?? undefined,
});

export const ChannelChip = ({ channel }: { channel: Channel }) => {
  const { openChannel } = useWorkspaceNavigation();
  const { displayImage, displayTitle, groupChannelDisplayInfo } = useChannelPreviewInfo({
    channel,
  });
  const { latestMessage } = useStateStore(
    channel.messagePaginator.aggregateState,
    latestMessageSelector,
  );
  const { senderName, text, type } = useLatestMessagePreview({
    latestMessage,
    participantCount: channel.data?.member_count,
  });

  return (
    <button
      className='cookbook-channel-chip'
      onClick={(event) => openChannel(channel, { event })}
      type='button'
    >
      <ChannelAvatar
        aria-hidden
        displayMembers={groupChannelDisplayInfo.members}
        imageUrl={displayImage}
        // Group avatars come in lg, xl and 2xl.
        size='lg'
        userName={displayTitle}
      />
      <span className='cookbook-channel-chip__text'>
        <span className='cookbook-channel-chip__title'>{displayTitle}</span>
        <span className='cookbook-channel-chip__preview'>
          {type === 'giphy' ? '🎞️ ' : null}
          {senderName ? `${senderName}: ` : null}
          {text}
        </span>
      </span>
    </button>
  );
};
