import type { ChannelHeaderTitleProps } from 'stream-chat-react';
import { ChannelHeader } from 'stream-chat-react';
import { useChannelDetailsPanel } from './ChannelDetailsPanel';
import { sectionsWithPresence } from './MembersWithPresence';
import './ChannelHeaderWithDetails.css';

/** The channel's title as a button that opens the channel's details in the side panel, and closes them. */
const TitleThatOpensDetails = ({ displayTitle }: ChannelHeaderTitleProps) => {
  const { isOpen, toggle } = useChannelDetailsPanel({
    sections: sectionsWithPresence,
  });

  return (
    // The name keeps the visible title, so voice control finds the button by what it shows.
    <button
      aria-expanded={isOpen}
      aria-label={`Channel details for ${displayTitle}`}
      className='str-chat__channel-header__data__title cookbook-channel-title-button'
      onClick={toggle}
      type='button'
    >
      {displayTitle}
    </button>
  );
};

export const ChannelHeaderWithDetails = () => (
  <ChannelHeader Title={TitleThatOpensDetails} />
);
