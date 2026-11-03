import type { PropsWithChildren } from 'react';
import { WithComponents } from 'stream-chat-react';
import { ChannelListLoadError } from './ChannelListLoadError';
import { ChannelListSkeleton } from './ChannelListSkeleton';
import { EmptyChannelList } from './EmptyChannelList';

// Declared once, so WithComponents gets the same object on every render.
const overrides = {
  EmptyListIndicator: EmptyChannelList,
  FirstPageLoadingIndicator: ChannelListSkeleton,
  ListLoadErrorIndicator: ChannelListLoadError,
};

/**
 * Replaces the loading, error and empty states of every channel list inside it. `ThreadList` reads
 * the loading and error slots too, so wrap only the channel list: the `ChannelNavigation` your view
 * renders, or `slotRenderers.channelList` when `ChatView` renders the list from its slot registry.
 */
export const WithChannelListStates = ({ children }: PropsWithChildren) => (
  <WithComponents overrides={overrides}>{children}</WithComponents>
);
