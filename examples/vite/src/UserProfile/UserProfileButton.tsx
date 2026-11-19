import { type MouseEvent, useCallback, useState } from 'react';
import { Avatar, GlobalModal, useChatContext } from 'stream-chat-react';
import {
  ChatViewSelectorButton,
  useChatViewNavigation,
} from 'stream-chat-react/slot-layout';

import { CHANNEL_THREAD_SLOT } from '../ChatLayout/constants.ts';
import { UserDetailDialog } from './UserDetailDialog';
import { useOwnUser } from './useOwnUser';

/** What the secondary slot holds when it shows the user's own profile: the SDK's `custom` kind. */
export type OwnProfileSource = { type: 'ownProfile' };

export const isOwnProfileSource = (source: unknown): source is OwnProfileSource =>
  (source as OwnProfileSource | undefined)?.type === 'ownProfile';

/**
 * Sidebar entry showing the connected user's avatar; opens their profile: in a modal on a plain
 * click, in the channels view's secondary slot on a ⌘/ctrl-click.
 */
export const UserProfileButton = ({ iconOnly = true }: { iconOnly?: boolean }) => {
  const { client } = useChatContext();
  const { open: openInLayout, openView } = useChatViewNavigation();
  const [user, setUser] = useOwnUser(client);
  const [open, setOpen] = useState(false);
  const close = useCallback(() => setOpen(false), []);

  const openProfile = (event: MouseEvent) => {
    if (!event.metaKey && !event.ctrlKey) {
      setOpen(true);
      return;
    }
    // The secondary slot belongs to the channels view, so the profile opens there.
    openView('channels');
    const source: OwnProfileSource = { type: 'ownProfile' };
    openInLayout(
      { key: 'ownProfile', kind: 'custom', source },
      { slot: CHANNEL_THREAD_SLOT },
    );
  };

  if (!user) return null;
  const displayName = user.name || user.id;

  return (
    <>
      <ChatViewSelectorButton
        aria-label='Open your profile'
        className='app__user-profile-button'
        iconOnly={iconOnly}
        onClick={openProfile}
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
