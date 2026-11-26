import { useCallback } from 'react';
import { useChatContext } from 'stream-chat-react';
import { useChatViewNavigation } from 'stream-chat-react/slot-layout';

import { useOwnUser, UserDetailDialog } from '../../UserProfile';
import { SecondarySlotSurface } from './SecondarySlotSurface';

// The user's own profile in the secondary slot, opened with a ⌘/ctrl-click on the sidebar's profile
// button (a plain click opens it in a modal). It is the SDK's `custom` kind.
export const OwnProfilePanel = ({ slot }: { slot: string }) => {
  const { client } = useChatContext();
  const { close } = useChatViewNavigation();
  const [user, setUser] = useOwnUser(client);
  const closePanel = useCallback(() => close(slot), [close, slot]);

  return (
    <SecondarySlotSurface>
      {user && (
        <UserDetailDialog onClose={closePanel} onUserChange={setUser} user={user} />
      )}
    </SecondarySlotSurface>
  );
};
