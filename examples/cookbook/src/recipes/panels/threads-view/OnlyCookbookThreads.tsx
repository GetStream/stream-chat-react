import type { PropsWithChildren } from 'react';
import { ThreadListItem, WithComponents } from 'stream-chat-react';
import type { ThreadListItemProps } from 'stream-chat-react';
import { visibleChannelIds } from '../../../base/client';

// The shared demo app keeps threads in channels the cookbook no longer lists, so the list shows
// only threads whose channel is one of the cookbook's. Cookbook code, not part of the recipe.
const CookbookThreadListItem = (props: ThreadListItemProps) =>
  visibleChannelIds.includes(props.thread.channel.id ?? '') ? (
    <ThreadListItem {...props} />
  ) : null;

const overrides = { ThreadListItem: CookbookThreadListItem };

export const OnlyCookbookThreads = ({ children }: PropsWithChildren) => (
  <WithComponents overrides={overrides}>{children}</WithComponents>
);
