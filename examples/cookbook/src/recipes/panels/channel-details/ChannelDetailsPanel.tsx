import { useMemo } from 'react';
import { ChannelInstanceProvider, ModalContextProvider } from 'stream-chat-react';
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
 * The SDK's `ChannelDetail` for the channel open in the `channel` slot, so it follows the user to
 * another channel.
 */
const ChannelDetails = ({ sections }: ChannelDetailsProps) => {
  const channel = useSlotChannel({ slot: 'channel' });
  const { closeSidePanel } = useSidePanel();
  // The sections close themselves through the modal context: their close button, and actions
  // such as opening a pinned message. Here, closing means closing the side panel.
  const modalContext = useMemo(() => ({ close: closeSidePanel }), [closeSidePanel]);
  const channelContext = useMemo(() => (channel ? { channel } : undefined), [channel]);

  if (!channelContext) return null;

  return (
    // Channel info reads the channel from the channel context for its online status, and the
    // side panel sits outside the channel's `Channel`.
    <ChannelInstanceProvider value={channelContext}>
      <ModalContextProvider value={modalContext}>
        <div className='cookbook-channel-details'>
          {/* A new channel starts the panel again on its first section. */}
          <ChannelDetail
            channel={channelContext.channel}
            key={channelContext.channel.cid}
            sections={sections}
          />
        </div>
      </ModalContextProvider>
    </ChannelInstanceProvider>
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
