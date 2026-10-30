import { useEffect, useState } from 'react';
import { convertTimestampToDate } from 'stream-chat';
import type { Channel, ChannelManagerState, UserResponse } from 'stream-chat';
import {
  Avatar,
  Button,
  useChannelDisplayName,
  useChatContext,
  useComponentContextIcons,
  useStateStore,
  useWorkspaceNavigation,
} from 'stream-chat-react';
import { findDirectConversation } from './directConversation';
import './UserDetailsPanel.css';

/**
 * The user as the client knows them, kept current: the client updates `client.state.users` on
 * every presence change and profile update of a user it has loaded, and the panel re-reads it then.
 */
const useUser = (userId: string): UserResponse | undefined => {
  const { client } = useChatContext();
  const [user, setUser] = useState(() => client.state.users[userId]);

  useEffect(() => {
    setUser(client.state.users[userId]);
    const update = (event: { user?: { id: string } }) => {
      if (event.user?.id !== userId) return;
      // A copy, so the panel renders again; nothing until the client has loaded the user.
      const loaded = client.state.users[userId];
      if (loaded) setUser({ ...loaded });
    };
    const presence = client.on('user.presence.changed', update);
    const updated = client.on('user.updated', update);
    return () => {
      presence.unsubscribe();
      updated.unsubscribe();
    };
  }, [client, userId]);

  return user;
};

const paginatorsSelector = ({ paginators }: ChannelManagerState) => ({ paginators });

/**
 * The channels the user's channel lists hold, each once, kept current as the lists load and
 * change. They're the channels the client has loaded for the user, so finding them sends no query.
 */
const useListedChannels = (): Channel[] => {
  const { channelManager } = useChatContext();
  const { paginators } = useStateStore(channelManager.state, paginatorsSelector);
  const [channels, setChannels] = useState<Channel[]>([]);

  useEffect(() => {
    const update = () =>
      setChannels([...new Set(paginators.flatMap((paginator) => paginator.items ?? []))]);
    update();
    const unsubscribers = paginators.map((paginator) =>
      paginator.state.subscribe(update),
    );
    return () => unsubscribers.forEach((unsubscribe) => unsubscribe());
  }, [paginators]);

  return channels;
};

// The panel's own text is English, so its dates are too. An app in another language passes its
// language here.
const lastActiveFormat = new Intl.DateTimeFormat('en-US', {
  dateStyle: 'medium',
  timeStyle: 'short',
});

const presenceText = (user: UserResponse) => {
  if (user.online) return 'Online';
  // A nanosecond timestamp, like every timestamp on the user.
  const lastActive = convertTimestampToDate(user.last_active);
  return lastActive ? `Last active ${lastActiveFormat.format(lastActive)}` : 'Offline';
};

/** A channel the user and the other person are both in, as a button that opens it. */
const SharedChannel = ({ channel }: { channel: Channel }) => {
  const { openChannel } = useWorkspaceNavigation();
  const name = useChannelDisplayName(channel);

  return (
    <li>
      <button
        className='cookbook-user-details__channel'
        onClick={(event) => openChannel(channel, { event })}
        type='button'
      >
        <span aria-hidden='true'>#</span> {name}
      </button>
    </li>
  );
};

/**
 * The side panel's body for a profile: the person's name, avatar and presence, the named channels
 * in the user's channel lists that both of them are in, and a Send message button that opens the
 * user's direct conversation with them.
 */
export const UserDetailsPanel = ({ userId }: { userId: string }) => {
  const { IconMessageBubble } = useComponentContextIcons();
  const { channelManager, client } = useChatContext();
  const { openChannel } = useWorkspaceNavigation();
  const user = useUser(userId);
  const listedChannels = useListedChannels();
  const [isOpening, setIsOpening] = useState(false);
  const [note, setNote] = useState<string>();

  const name = user?.name ?? userId;
  const isMe = userId === client.userId;
  // Named channels both of them are in, from the channel lists: the direct conversation has no name.
  const sharedChannels = listedChannels.filter(
    (channel) =>
      !!channel.state.members[userId] &&
      !!client.userId &&
      !!channel.state.members[client.userId] &&
      'name' in (channel.data?.custom ?? {}),
  );

  const sendMessage = async () => {
    setIsOpening(true);
    setNote(undefined);
    try {
      const conversation = await findDirectConversation(client, userId);
      if (!conversation) {
        setNote(`No direct conversation with ${name} yet.`);
        return;
      }
      channelManager.ingestChannel(conversation);
      openChannel(conversation);
    } catch {
      setNote("Couldn't open the conversation. Try again.");
    } finally {
      setIsOpening(false);
    }
  };

  return (
    <div className='cookbook-user-details'>
      <div className='cookbook-user-details__identity'>
        {/* The name is written out below, so the avatar is decorative. */}
        <Avatar
          aria-hidden
          imageUrl={user?.image}
          isOnline={!!user?.online}
          role='presentation'
          size='2xl'
          userName={name}
        />
        <p className='cookbook-user-details__name'>{name}</p>
        {user && <p className='cookbook-user-details__presence'>{presenceText(user)}</p>}
      </div>
      {!isMe && (
        <Button
          appearance='solid'
          disabled={isOpening}
          onClick={sendMessage}
          size='md'
          variant='primary'
        >
          <IconMessageBubble />
          Send message
        </Button>
      )}
      {note && (
        <p className='cookbook-user-details__note' role='status'>
          {note}
        </p>
      )}
      {!isMe && !!sharedChannels.length && (
        <section className='cookbook-user-details__section'>
          <h3 className='cookbook-side-panel__section-title'>Shared channels</h3>
          <ul className='cookbook-user-details__channels'>
            {sharedChannels.map((channel) => (
              <SharedChannel channel={channel} key={channel.cid} />
            ))}
          </ul>
        </section>
      )}
    </div>
  );
};
