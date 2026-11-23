import type { PropsWithChildren } from 'react';
import { ChannelList, WithComponents } from 'stream-chat-react';
import type { ChannelListProps } from 'stream-chat-react';
import { ChannelListLoadError } from './ChannelListLoadError';
import { ChannelListSkeleton } from './ChannelListSkeleton';
import { EmptyChannelList } from './EmptyChannelList';

// Declared once, so WithComponents gets the same object on every render.
const listStates = {
  ListEmptyUI: EmptyChannelList,
  ListFirstPageLoadingUI: ChannelListSkeleton,
  ListLoadErrorUI: ChannelListLoadError,
};

/**
 * The SDK's channel list with the recipe's list states. The `List…UI` slots reach every list below
 * their `WithComponents`, so they are set around each channel list alone: search results keep their
 * own states.
 */
const ChannelListWithStates = (props: ChannelListProps) => (
  <WithComponents overrides={listStates}>
    <ChannelList {...props} />
  </WithComponents>
);

const overrides = { ChannelList: ChannelListWithStates };

/**
 * Replaces the loading, error and empty states of every channel list `ChannelLists` renders inside
 * it (`ChannelNavigation` renders `ChannelLists`), through the `ChannelList` slot that `ChannelLists`
 * renders once per paginator.
 */
export const WithChannelListStates = ({ children }: PropsWithChildren) => (
  <WithComponents overrides={overrides}>{children}</WithComponents>
);
