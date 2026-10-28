import { useEffect, useState } from 'react';
import { ChannelPaginator } from 'stream-chat';
import type {
  Channel,
  ChannelFilters,
  ChannelMemberResponse,
  ChannelPaginatorOptions,
  SortParamRequest,
} from 'stream-chat';
import { useChatContext } from 'stream-chat-react';

/** The user joined the channel: they weren't invited, or they accepted the invite. */
const hasJoined = (channel: Channel) => {
  const { invite_accepted_at, invited } = channel.state.membership;
  return !invited || !!invite_accepted_at;
};

/** The member answered their invite, on this device or another. */
const hasAnswered = ({ invite_accepted_at, invite_rejected_at }: ChannelMemberResponse) =>
  !!(invite_accepted_at || invite_rejected_at);

/**
 * A channel paginator that checks the `joined` filter on the channel's membership, as the server
 * does, when an event asks whether a channel belongs in the list.
 */
class JoinedChannelPaginator extends ChannelPaginator {
  constructor(options: ChannelPaginatorOptions) {
    super(options);
    // First in the list: the last default resolver takes every field it reaches.
    this.setFilterResolvers([
      { matchesField: (field) => field === 'joined', resolve: hasJoined },
      ...this._filterFieldToDataResolvers,
    ]);
  }
}

// The channel with the latest message first.
const byLastMessage: SortParamRequest[] = [{ direction: -1, field: 'last_message_at' }];
// The newest channel first.
const byCreatedAt: SortParamRequest[] = [{ direction: -1, field: 'created_at' }];

/**
 * Registers the channel list's paginator on `client.channelManager`, limited to channels the user
 * joined, and returns a second paginator with the channels the user is invited to. `filters`
 * scope both to the user's channels; pass a stable object. Returns `undefined` until both exist.
 */
export const useChannelInvites = (filters: ChannelFilters) => {
  const { client } = useChatContext();
  const [invites, setInvites] = useState<ChannelPaginator>();

  useEffect(() => {
    const channels = new JoinedChannelPaginator({
      client,
      filters: { ...filters, joined: true },
      id: 'channels',
      requestOptions: { presence: true, state: true },
      sort: byLastMessage,
    });
    const invites = new ChannelPaginator({
      client,
      filters: { ...filters, invite: 'pending' },
      id: 'invites',
      paginatorOptions: { pageSize: 5 },
      sort: byCreatedAt,
    });
    client.channelManager.insertPaginator({ paginator: channels });

    // A paginator runs one query at a time, so an invite that arrives during a load is noted, and
    // loaded once that load ends. The reload keeps the rows on screen until its page arrives.
    let reloadWhenIdle = false;
    const reload = () => {
      if (invites.isLoading) {
        reloadWhenIdle = true;
        return;
      }
      reloadWhenIdle = false;
      void invites.toTail({ keepPreviousItems: true, reset: 'yes' });
    };
    const offLoadEnd = invites.state.subscribeWithSelector(
      ({ isLoading }) => ({ isLoading }),
      ({ isLoading }) => {
        if (!isLoading && reloadWhenIdle) reload();
      },
    );

    // `ChannelNavigation` renders a channel list for every paginator on the manager, so the
    // invites stay off it and follow the events themselves. The invites query watches its
    // channels, so a watched channel's answer arrives as `member.updated`, not as a
    // notification. A new invite arrives as `notification.invited`.
    const { unsubscribe } = client.on((event) => {
      if (event.type === 'notification.invited') reload();
      if (
        event.type === 'member.updated' &&
        event.member.user_id === client.userId &&
        hasAnswered(event.member)
      )
        invites.removeItem({ id: event.cid });
    });
    setInvites(invites);

    return () => {
      unsubscribe();
      offLoadEnd();
      client.channelManager.removePaginator(channels);
      channels.dispose();
      invites.dispose();
      setInvites(undefined);
    };
  }, [client, filters]);

  return invites;
};
