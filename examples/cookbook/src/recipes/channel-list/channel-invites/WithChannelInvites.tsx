import { createContext, useContext, useMemo } from 'react';
import type { ComponentType, PropsWithChildren } from 'react';
import type {
  ChannelFilters,
  ChannelPaginator,
  SearchControllerState,
} from 'stream-chat';
import {
  Search as DefaultSearch,
  useChatContext,
  useComponentContext,
  useStateStore,
  WithComponents,
} from 'stream-chat-react';
import { Invitations } from './Invitations';
import { useChannelInvites } from './useChannelInvites';

const InvitesContext = createContext<{
  invites?: ChannelPaginator;
  Search: ComponentType;
}>({ Search: DefaultSearch });

const searchSelector = ({ isActive }: SearchControllerState) => ({ isActive });

/**
 * The app's search, then the invitations while no search is open. `ChannelNavigation` renders its
 * `Search` slot right above the channel list, so the invitations sit there too.
 */
const SearchWithInvitations = () => {
  const { invites, Search } = useContext(InvitesContext);
  const { searchController } = useChatContext();
  const { isActive } = useStateStore(searchController.state, searchSelector);

  return (
    <>
      <Search />
      {!isActive && invites && <Invitations paginator={invites} />}
    </>
  );
};

// Declared once, so WithComponents gets the same object on every render.
const overrides = { Search: SearchWithInvitations };

/**
 * Shows the channels the user is invited to above the channel list, and keeps them out of the
 * list until the user accepts. `filters` scope both to the user's channels; pass a stable object.
 * Keeps the app's own `Search` override, if it has one.
 */
export const WithChannelInvites = ({
  children,
  filters,
}: PropsWithChildren<{ filters: ChannelFilters }>) => {
  const invites = useChannelInvites(filters);
  // Read outside this component's own WithComponents, where `Search` is still the app's.
  const { Search = DefaultSearch } = useComponentContext();
  const value = useMemo(() => ({ invites, Search }), [invites, Search]);

  return (
    <InvitesContext.Provider value={value}>
      <WithComponents overrides={overrides}>{children}</WithComponents>
    </InvitesContext.Provider>
  );
};
