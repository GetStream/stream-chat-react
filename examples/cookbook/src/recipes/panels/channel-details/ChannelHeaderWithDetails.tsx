import type { ChannelConfig, ChannelStateData, EventPayload } from 'stream-chat';
import {
  ChannelAvatar,
  TypingIndicatorHeader,
  useChannel,
  useChannelPreviewInfo,
  useChatContext,
  useStateStore,
  WorkspaceNavigationBackButton,
  WorkspaceNavigationCloseButton,
} from 'stream-chat-react';
import { useChannelDetailsPanel } from './ChannelDetailsPanel';
import { sectionsWithPresence } from './MembersWithPresence';
import './ChannelHeaderWithDetails.css';

const channelStateSelector = ({
  memberCount,
  typing,
  watcherCount,
}: ChannelStateData) => ({
  memberCount,
  typing,
  watcherCount,
});

const typingEventsSelector = ({ typingEvents }: ChannelConfig) => ({
  typingEventsEnabled: typingEvents.enabled,
});

/**
 * The SDK's channel header, rebuilt from its parts so the channel's title is a button that opens
 * the channel's details in the side panel, and closes them. It keeps the SDK's classes, so it
 * looks like the header it replaces.
 */
export const ChannelHeaderWithDetails = () => {
  const { client } = useChatContext();
  const channel = useChannel();
  const { memberCount, typing, watcherCount } = useStateStore(
    channel.state,
    channelStateSelector,
  );
  const { typingEventsEnabled } = useStateStore(
    channel.configState,
    typingEventsSelector,
  );
  const { displayImage, displayTitle, groupChannelDisplayInfo } = useChannelPreviewInfo({
    channel,
  });
  const { isOpen, toggle } = useChannelDetailsPanel({ sections: sectionsWithPresence });

  // Others typing in the channel itself; replies typed in threads carry a parent_id.
  const someoneIsTyping = (Object.values(typing) as EventPayload<'typing.start'>[]).some(
    ({ parent_id, user }) => !parent_id && user?.id !== client.userId,
  );

  return (
    <div className='str-chat__channel-header'>
      <div className='str-chat__channel-header__start'>
        <WorkspaceNavigationBackButton />
      </div>
      <div className='str-chat__channel-header__data'>
        {/* The name keeps the visible title, so voice control finds the button by what it shows. */}
        <button
          aria-expanded={isOpen}
          aria-label={`Channel details for ${displayTitle}`}
          className='str-chat__channel-header__data__title cookbook-channel-title-button'
          onClick={toggle}
          type='button'
        >
          {displayTitle}
        </button>
        <div className='str-chat__channel-header__data__subtitle'>
          {typingEventsEnabled && someoneIsTyping ? (
            <TypingIndicatorHeader />
          ) : (
            `${memberCount} members · ${watcherCount} online`
          )}
        </div>
      </div>
      <div className='str-chat__channel-header__end'>
        <ChannelAvatar
          className='str-chat__avatar--channel-header'
          displayMembers={groupChannelDisplayInfo.members}
          imageUrl={displayImage}
          size='lg'
          userName={displayTitle}
        />
        <WorkspaceNavigationCloseButton />
      </div>
    </div>
  );
};
