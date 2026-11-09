import type { PropsWithChildren } from 'react';
import { Search, WithComponents } from 'stream-chat-react';

const SidebarSearch = () => (
  <Search
    directMessagingChannelType='team'
    exitSearchOnInputBlur
    placeholder='Search teammates, channels and messages'
  />
);

// Declared once, so WithComponents gets the same object on every render.
const overrides = { Search: SidebarSearch };

export const WithSidebarSearch = ({ children }: PropsWithChildren) => (
  <WithComponents overrides={overrides}>{children}</WithComponents>
);
