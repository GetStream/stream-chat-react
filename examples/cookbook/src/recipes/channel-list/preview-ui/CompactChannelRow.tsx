import type { PropsWithChildren } from 'react';
import type { ChannelListItemUIProps } from 'stream-chat-react';
import {
  ChannelAvatar,
  ChannelListItemActionButtons,
  ChannelListItemTimestamp,
  composeChannelListItemAccessibleLabel,
  SummarizedMessagePreview,
  useChatContext,
  useTranslationContext,
  useWorkspaceNavigation,
  WithComponents,
} from 'stream-chat-react';
import './CompactChannelRow.css';

const CompactChannelRow = ({
  accessibleLabelConfig,
  active,
  channel,
  className,
  displayImage,
  displayTitle,
  groupChannelDisplayInfo,
  messageDeliveryStatus,
  onSelect,
  previewedMessage,
  unread,
}: ChannelListItemUIProps) => {
  const { client, isMessageAIGenerated } = useChatContext();
  const { t, tDateTimeParser, userLanguage } = useTranslationContext();
  const { openChannel } = useWorkspaceNavigation();
  // What a screen reader announces for the row: name, unread count, last message and its time.
  const accessibleLabel = composeChannelListItemAccessibleLabel(
    {
      active,
      channel,
      client,
      displayTitle,
      isMessageAIGenerated,
      latestMessage: previewedMessage,
      messageDeliveryStatus,
      t,
      tDateTimeParser,
      unreadCount: unread,
      userLanguage,
    },
    accessibleLabelConfig,
  );

  return (
    <div className='str-chat__channel-list-item-container'>
      <button
        aria-label={accessibleLabel}
        aria-selected={active || undefined}
        // Search results pass their own class, `str-chat__search-result`.
        className={
          className ? `cookbook-channel-row ${className}` : 'cookbook-channel-row'
        }
        onClick={(event) => {
          if (onSelect) onSelect(event);
          else openChannel(channel, { event });
        }}
        role='option'
        type='button'
      >
        <ChannelAvatar
          aria-hidden
          displayMembers={groupChannelDisplayInfo?.members}
          imageUrl={displayImage}
          size='lg'
          userName={displayTitle}
        />
        <div className='cookbook-channel-row__main'>
          <div className='cookbook-channel-row__top'>
            <span className='cookbook-channel-row__title'>{displayTitle}</span>
            <ChannelListItemTimestamp previewedMessage={previewedMessage} />
          </div>
          <SummarizedMessagePreview
            latestMessage={previewedMessage}
            messageDeliveryStatus={messageDeliveryStatus}
            participantCount={channel.data?.member_count}
          />
        </div>
        {!!unread && <span className='cookbook-channel-row__unread'>{unread}</span>}
      </button>
      <ChannelListItemActionButtons />
    </div>
  );
};

// Declared once, so WithComponents gets the same object on every render.
const overrides = { ChannelListItemUI: CompactChannelRow };

export const WithCompactChannelRows = ({ children }: PropsWithChildren) => (
  <WithComponents overrides={overrides}>{children}</WithComponents>
);
