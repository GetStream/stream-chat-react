import { ChannelDetail } from 'stream-chat-react/channel-detail';
import type { SectionNavigatorSection } from 'stream-chat-react/channel-detail';
import { useSlotChannel } from 'stream-chat-react/slot-layout';
import { useSidePanel } from '../../../base/SidePanel';
import './ChannelDetailsPanel.css';

const CHANNEL_DETAILS_ID = 'channel-details';

type ChannelDetailsProps = {
  /** The panel's sections, in order. Defaults to the SDK's five. */
  sections?: SectionNavigatorSection[];
};

/**
 * The SDK's `ChannelDetail` for the channel open in the `channel` slot. Picking a channel from the
 * list closes the panel; a channel opened any other way while it's open, such as from a link, shows
 * its own details.
 */
const ChannelDetails = ({ sections }: ChannelDetailsProps) => {
  const channel = useSlotChannel({ slot: 'channel' });
  const { closeSidePanel } = useSidePanel();

  if (!channel) return null;

  return (
    <div className='cookbook-channel-details'>
      {/* A new channel starts the panel again on its first section. The sections' close
          button, and actions such as opening a pinned message, close the side panel. */}
      <ChannelDetail
        channel={channel}
        key={channel.cid}
        onClose={closeSidePanel}
        sections={sections}
      />
    </div>
  );
};

/**
 * Opens the channel's details in the side panel, and closes them when they're the open content.
 * `isOpen` tells the control that toggles them whether the details are on screen.
 */
export const useChannelDetailsPanel = ({ sections }: ChannelDetailsProps = {}) => {
  const { closeSidePanel, openId, openSidePanel } = useSidePanel();
  const isOpen = openId === CHANNEL_DETAILS_ID;

  const toggle = () => {
    if (isOpen) closeSidePanel();
    else
      openSidePanel({
        body: <ChannelDetails sections={sections} />,
        id: CHANNEL_DETAILS_ID,
        // ChannelDetail brings its own header, with the section's title and a close button.
        ownHeader: true,
        title: 'Channel details',
      });
  };

  return { isOpen, toggle };
};
