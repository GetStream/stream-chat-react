import { useCallback, useState } from 'react';
import { Avatar, GlobalModal, useChatContext } from 'stream-chat-react';
import { ChatViewSelectorButton } from 'stream-chat-react/slot-layout';

import { UserDetailDialog } from './UserDetailDialog';
import { useOwnUser } from './useOwnUser';

/** Sidebar entry showing the connected user's avatar; opens their profile. */
export const UserProfileButton = ({ iconOnly = true }: { iconOnly?: boolean }) => {
  const { client } = useChatContext();
  const [user, setUser] = useOwnUser(client);
  const [open, setOpen] = useState(false);
  const close = useCallback(() => setOpen(false), []);

  if (!user) return null;
  const displayName = user.name || user.id;

  return (
    <>
      <ChatViewSelectorButton
        aria-label='Open your profile'
        className='app__user-profile-button'
        iconOnly={iconOnly}
        onClick={() => setOpen(true)}
        text={displayName}
      >
        <Avatar imageUrl={user.image} size='sm' userName={displayName} />
      </ChatViewSelectorButton>
      <GlobalModal onClose={close} open={open}>
        <UserDetailDialog onClose={close} onUserChange={setUser} user={user} />
      </GlobalModal>
    </>
  );
};
