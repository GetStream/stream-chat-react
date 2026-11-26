import { useCallback, useMemo } from 'react';
import type { Channel as StreamChannel } from 'stream-chat';
import { ChannelInstanceProvider } from 'stream-chat-react';
import { useChatViewNavigation } from 'stream-chat-react/slot-layout';

import { ConfiguredChannelDetail } from '../../ChannelDetail';
import { SecondarySlotSurface } from './SecondarySlotSurface';

// A channel's details in the secondary slot, opened with a ⌘/ctrl-click on the channel header's
// avatar (a plain click opens them in a modal). They are the SDK's `custom` kind.
export const ChannelDetailPanel = ({
  channel,
  slot,
}: {
  channel: StreamChannel;
  slot: string;
}) => {
  const { close } = useChatViewNavigation();
  const closePanel = useCallback(() => close(slot), [close, slot]);
  // The channel's online status reads the channel from the channel context, which this panel is
  // outside of.
  const channelContext = useMemo(() => ({ channel }), [channel]);

  return (
    <SecondarySlotSurface>
      <ChannelInstanceProvider value={channelContext}>
        {/* The secondary column is narrow, so the sections open one at a time. */}
        <ConfiguredChannelDetail
          channel={channel}
          defaultLayout='inline'
          key={channel.cid}
          onClose={closePanel}
        />
      </ChannelInstanceProvider>
    </SecondarySlotSurface>
  );
};
