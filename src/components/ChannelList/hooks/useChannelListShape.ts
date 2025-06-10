// const defaults = useChannelListShapeDefaults();

import { Dispatch, SetStateAction, useCallback, useEffect, useMemo, useRef } from 'react';
import { Channel, Event, ExtendableGenerics } from 'stream-chat';

import {
  extractSortValue,
  findLastPinnedChannelIndex,
  isChannelArchived,
  isChannelPinned,
  moveChannelUpwards,
  shouldConsiderArchivedChannels,
  shouldConsiderPinnedChannels,
} from '../utils';
import { useChatContext } from '../../../context';
import { getChannel } from '../../../utils';
import { ChannelListProps } from '../ChannelList';

type SetChannels<SCG extends ExtendableGenerics> = Dispatch<
  SetStateAction<Channel<SCG>[]>
>;

type BaseParameters<SCG extends ExtendableGenerics> = {
  event: Event<SCG>;
  setChannels: SetChannels<SCG>;
};

type RepeatedParameters<SCG extends ExtendableGenerics> = {
  customHandler?: (
    setChannels: BaseParameters<SCG>['setChannels'],
    event: BaseParameters<SCG>['event'],
  ) => void;
};

type HandleMessageNewParameters<SCG extends ExtendableGenerics> = BaseParameters<SCG> &
  RepeatedParameters<SCG> & {
    allowNewMessagesFromUnfilteredChannels: boolean;
    lockChannelOrder: boolean;
  } & Required<Pick<ChannelListProps<SCG>, 'filters' | 'sort'>>;

type HandleNotificationMessageNewParameters<SCG extends ExtendableGenerics> =
  BaseParameters<SCG> &
    RepeatedParameters<SCG> & {
      allowNewMessagesFromUnfilteredChannels: boolean;
      lockChannelOrder: boolean;
    } & Required<Pick<ChannelListProps<SCG>, 'filters' | 'sort'>>;

type HandleNotificationRemovedFromChannelParameters<SCG extends ExtendableGenerics> =
  BaseParameters<SCG> & RepeatedParameters<SCG>;

type HandleNotificationAddedToChannelParameters<SCG extends ExtendableGenerics> =
  BaseParameters<SCG> &
    RepeatedParameters<SCG> & {
      allowNewMessagesFromUnfilteredChannels: boolean;
      lockChannelOrder: boolean;
    } & Required<Pick<ChannelListProps<SCG>, 'sort'>>;

type HandleMemberUpdatedParameters<SCG extends ExtendableGenerics> =
  BaseParameters<SCG> & {
    lockChannelOrder: boolean;
  } & Required<Pick<ChannelListProps<SCG>, 'sort' | 'filters'>>;

type HandleChannelDeletedParameters<SCG extends ExtendableGenerics> =
  BaseParameters<SCG> & RepeatedParameters<SCG>;

type HandleChannelHiddenParameters<SCG extends ExtendableGenerics> = BaseParameters<SCG> &
  RepeatedParameters<SCG>;

type HandleChannelVisibleParameters<SCG extends ExtendableGenerics> =
  BaseParameters<SCG> &
    RepeatedParameters<SCG> &
    Required<Pick<ChannelListProps<SCG>, 'sort' | 'filters'>>;

type HandleChannelTruncatedParameters<SCG extends ExtendableGenerics> =
  BaseParameters<SCG> & RepeatedParameters<SCG>;

type HandleChannelUpdatedParameters<SCG extends ExtendableGenerics> =
  BaseParameters<SCG> & RepeatedParameters<SCG>;

type HandleUserPresenceChangedParameters<SCG extends ExtendableGenerics> =
  BaseParameters<SCG>;

const shared = <SCG extends ExtendableGenerics>({
  customHandler,
  event,
  setChannels,
}: BaseParameters<SCG> & RepeatedParameters<SCG>) => {
  if (typeof customHandler === 'function') {
    return customHandler(setChannels, event);
  }

  setChannels((channels) => {
    const channelIndex = channels.findIndex((channel) => channel.cid === event.cid);

    if (channelIndex < 0) return channels;

    channels.splice(channelIndex, 1);

    return [...channels];
  });
};

export const useChannelListShapeDefaults = <SCG extends ExtendableGenerics>() => {
  const { client } = useChatContext<SCG>();

  const handleMessageNew = useCallback(
    ({
      allowNewMessagesFromUnfilteredChannels,
      customHandler,
      event,
      filters,
      lockChannelOrder,
      setChannels,
      sort,
    }: HandleMessageNewParameters<SCG>) => {
      if (typeof customHandler === 'function') {
        return customHandler(setChannels, event);
      }

      const channelType = event.channel_type;
      const channelId = event.channel_id;

      if (!channelType || !channelId) return;

      setChannels((currentChannels) => {
        const targetChannel = client.channel(channelType, channelId);
        const targetChannelIndex = currentChannels.indexOf(targetChannel);
        const targetChannelExistsWithinList = targetChannelIndex >= 0;

        const isTargetChannelPinned = isChannelPinned(targetChannel);
        const isTargetChannelArchived = isChannelArchived(targetChannel);

        const considerArchivedChannels = shouldConsiderArchivedChannels(filters);
        const considerPinnedChannels = shouldConsiderPinnedChannels(sort);

        if (
          // filter is defined, target channel is archived and filter option is set to false
          (considerArchivedChannels && isTargetChannelArchived && !filters.archived) ||
          // filter is defined, target channel isn't archived and filter option is set to true
          (considerArchivedChannels && !isTargetChannelArchived && filters.archived) ||
          // sort option is defined, target channel is pinned
          (considerPinnedChannels && isTargetChannelPinned) ||
          // list order is locked
          lockChannelOrder ||
          // target channel is not within the loaded list and loading from cache is disallowed
          (!targetChannelExistsWithinList && !allowNewMessagesFromUnfilteredChannels)
        ) {
          return currentChannels;
        }

        return moveChannelUpwards({
          channels: currentChannels,
          channelToMove: targetChannel,
          channelToMoveIndexWithinChannels: targetChannelIndex,
          sort,
        });
      });
    },
    [client],
  );

  const handleNotificationMessageNew = useCallback(
    async ({
      allowNewMessagesFromUnfilteredChannels,
      customHandler,
      event,
      filters,
      setChannels,
      sort,
    }: HandleNotificationMessageNewParameters<SCG>) => {
      if (typeof customHandler === 'function') {
        return customHandler(setChannels, event);
      }

      if (!event.channel) {
        return;
      }

      const channel = await getChannel({
        client,
        id: event.channel.id,
        type: event.channel.type,
      });

      const considerArchivedChannels = shouldConsiderArchivedChannels(filters);
      if (isChannelArchived(channel) && considerArchivedChannels && !filters.archived) {
        return;
      }

      if (!allowNewMessagesFromUnfilteredChannels) {
        return;
      }

      setChannels((channels) =>
        moveChannelUpwards({
          channels,
          channelToMove: channel,
          sort,
        }),
      );
    },
    [client],
  );

  const handleNotificationAddedToChannel = useCallback(
    async ({
      allowNewMessagesFromUnfilteredChannels,
      customHandler,
      event,
      setChannels,
      sort,
    }: HandleNotificationAddedToChannelParameters<SCG>) => {
      if (typeof customHandler === 'function') {
        return customHandler(setChannels, event);
      }

      if (!event.channel || !allowNewMessagesFromUnfilteredChannels) {
        return;
      }

      const channel = await getChannel({
        client,
        id: event.channel.id,
        members: event.channel.members?.reduce<string[]>(
          (newMembers, { user, user_id }) => {
            const userId = user_id || user?.id;

            if (userId) newMembers.push(userId);

            return newMembers;
          },
          [],
        ),
        type: event.channel.type,
      });

      // membership has been reset (target channel shouldn't be pinned nor archived)
      setChannels((channels) =>
        moveChannelUpwards({
          channels,
          channelToMove: channel,
          sort,
        }),
      );
    },
    [client],
  );

  const handleNotificationRemovedFromChannel = useCallback(
    ({
      customHandler,
      event,
      setChannels,
    }: HandleNotificationRemovedFromChannelParameters<SCG>) => {
      if (typeof customHandler === 'function') {
        return customHandler(setChannels, event);
      }

      setChannels((channels) =>
        channels.filter((channel) => channel.cid !== event.channel?.cid),
      );
    },
    [],
  );

  const handleMemberUpdated = useCallback(
    ({
      event,
      filters,
      lockChannelOrder,
      setChannels,
      sort,
    }: HandleMemberUpdatedParameters<SCG>) => {
      if (
        !event.member?.user ||
        event.member.user.id !== client.userID ||
        !event.channel_type
      ) {
        return;
      }

      const channelType = event.channel_type;
      const channelId = event.channel_id;

      const considerPinnedChannels = shouldConsiderPinnedChannels(sort);
      const considerArchivedChannels = shouldConsiderArchivedChannels(filters);

      // `pinned_at` nor `archived` properties are set or channel list order is locked, return early
      if ((!considerPinnedChannels && !considerArchivedChannels) || lockChannelOrder) {
        return;
      }

      const pinnedAtSort = extractSortValue({ atIndex: 0, sort, targetKey: 'pinned_at' });

      setChannels((currentChannels) => {
        const targetChannel = client.channel(channelType, channelId);
        // assumes that channel instances are not changing
        const targetChannelIndex = currentChannels.indexOf(targetChannel);
        const targetChannelExistsWithinList = targetChannelIndex >= 0;

        const isTargetChannelArchived = isChannelArchived(targetChannel);
        const isTargetChannelPinned = isChannelPinned(targetChannel);

        const newChannels = [...currentChannels];

        if (targetChannelExistsWithinList) {
          newChannels.splice(targetChannelIndex, 1);
        }

        // handle archiving (remove channel)
        if (
          (considerArchivedChannels && isTargetChannelArchived && !filters.archived) ||
          (considerArchivedChannels && !isTargetChannelArchived && filters.archived)
        ) {
          return newChannels;
        }

        let lastPinnedChannelIndex: number | null = null;

        // calculate last pinned channel index only if `pinned_at` sort is set to
        // ascending order or if it's in descending order while the pin is being removed, otherwise
        // we move to the top (index 0)
        if (pinnedAtSort === 1 || (pinnedAtSort === -1 && !isTargetChannelPinned)) {
          lastPinnedChannelIndex = findLastPinnedChannelIndex({ channels: newChannels });
        }

        const newTargetChannelIndex =
          typeof lastPinnedChannelIndex === 'number' ? lastPinnedChannelIndex + 1 : 0;

        // skip re-render if the position of the channel does not change
        if (currentChannels[newTargetChannelIndex] === targetChannel) {
          return currentChannels;
        }

        newChannels.splice(newTargetChannelIndex, 0, targetChannel);

        return newChannels;
      });
    },
    [client],
  );

  const handleChannelDeleted = useCallback(
    (p: HandleChannelDeletedParameters<SCG>) => shared<SCG>(p),
    [],
  );

  const handleChannelHidden = useCallback(
    (p: HandleChannelHiddenParameters<SCG>) => shared<SCG>(p),
    [],
  );

  const handleChannelVisible = useCallback(
    async ({
      customHandler,
      event,
      filters,
      setChannels,
      sort,
    }: HandleChannelVisibleParameters<SCG>) => {
      if (typeof customHandler === 'function') {
        return customHandler(setChannels, event);
      }

      if (!event.channel_id && !event.channel_type) {
        return;
      }

      const channel = await getChannel({
        client,
        id: event.channel_id,
        type: event.channel_type,
      });

      const considerArchivedChannels = shouldConsiderArchivedChannels(filters);
      if (isChannelArchived(channel) && considerArchivedChannels && !filters.archived) {
        return;
      }

      setChannels((channels) =>
        moveChannelUpwards({
          channels,
          channelToMove: channel,
          sort,
        }),
      );
    },
    [client],
  );

  const handleChannelTruncated = useCallback(
    ({ customHandler, event, setChannels }: HandleChannelTruncatedParameters<SCG>) => {
      if (typeof customHandler === 'function') {
        return customHandler(setChannels, event);
      }

      // TODO: not sure whether this is needed
      setChannels((channels) => [...channels]);
      // if (forceUpdate) {
      //   forceUpdate();
      // }
    },
    [],
  );

  const handleChannelUpdated = useCallback(
    ({ customHandler, event, setChannels }: HandleChannelUpdatedParameters<SCG>) => {
      if (typeof customHandler === 'function') {
        return customHandler(setChannels, event);
      }

      setChannels((channels) => {
        const channelIndex = channels.findIndex(
          (channel) => channel.cid === event.channel?.cid,
        );

        if (channelIndex > -1 && event.channel) {
          const newChannels = channels;
          newChannels[channelIndex].data = {
            ...event.channel,
            hidden: event.channel?.hidden ?? newChannels[channelIndex].data?.hidden,
            own_capabilities:
              event.channel?.own_capabilities ??
              newChannels[channelIndex].data?.own_capabilities,
          };

          return [...newChannels];
        }

        return channels;
      });

      // if (forceUpdate) {
      //   forceUpdate();
      // }
    },
    [],
  );

  const handleUserPresenceChanged = useCallback(
    ({ event, setChannels }: HandleUserPresenceChangedParameters<SCG>) => {
      setChannels((channels) => {
        const newChannels = channels.map((channel) => {
          if (!event.user?.id || !channel.state.members[event.user.id]) {
            return channel;
          }

          // FIXME: oh no...
          const newChannel = channel;
          newChannel.state.members[event.user.id].user = event.user;

          return newChannel;
        });

        return newChannels;
      });
    },
    [],
  );

  return useMemo(
    () => ({
      handleChannelDeleted,
      handleChannelHidden,
      handleChannelTruncated,
      handleChannelUpdated,
      handleChannelVisible,
      handleMemberUpdated,
      handleMessageNew,
      handleNotificationAddedToChannel,
      handleNotificationMessageNew,
      handleNotificationRemovedFromChannel,
      handleUserPresenceChanged,
    }),
    [
      handleChannelDeleted,
      handleChannelHidden,
      handleChannelTruncated,
      handleChannelUpdated,
      handleChannelVisible,
      handleMemberUpdated,
      handleMessageNew,
      handleNotificationAddedToChannel,
      handleNotificationMessageNew,
      handleNotificationRemovedFromChannel,
      handleUserPresenceChanged,
    ],
  );
};

type UseDefaultHandleChannelListShapeParameters<SCG extends ExtendableGenerics> =
  Required<
    Pick<
      ChannelListProps<SCG>,
      'allowNewMessagesFromUnfilteredChannels' | 'lockChannelOrder' | 'filters' | 'sort'
    >
  > &
    Pick<
      ChannelListProps<SCG>,
      | 'onAddedToChannel'
      | 'onChannelDeleted'
      | 'onChannelHidden'
      | 'onChannelTruncated'
      | 'onChannelUpdated'
      | 'onChannelVisible'
      | 'onMessageNew'
      | 'onMessageNewHandler'
      | 'onRemovedFromChannel'
    > & {
      setChannels: SetChannels<SCG>;
      customHandleChannelListShape?: (data: {
        // can't use ReturnType<typeof useChannelListShapeDefaults<SCG>> until we upgrade prettier to at least v2.7.0
        defaults: ReturnType<typeof useChannelListShapeDefaults>;
        event: Event<SCG>;
        setChannels: SetChannels<SCG>;
      }) => void;
    };

export const usePrepareShapeHandlers = <SCG extends ExtendableGenerics>({
  allowNewMessagesFromUnfilteredChannels,
  customHandleChannelListShape,
  filters,
  lockChannelOrder,
  onAddedToChannel,
  onChannelDeleted,
  onChannelHidden,
  onChannelTruncated,
  onChannelUpdated,
  onChannelVisible,
  onMessageNew,
  onMessageNewHandler,
  onRemovedFromChannel,
  setChannels,
  sort,
}: UseDefaultHandleChannelListShapeParameters<SCG>) => {
  const defaults = useChannelListShapeDefaults<SCG>();

  const defaultHandleChannelListShapeRef = useRef<(e: Event<SCG>) => void>(undefined);

  const customHandleChannelListShapeRef = useRef<(e: Event<SCG>) => void>(undefined);

  customHandleChannelListShapeRef.current = (event: Event<SCG>) => {
    // @ts-expect-error can't use ReturnType<typeof useChannelListShapeDefaults<SCG>> until we upgrade prettier to at least v2.7.0
    customHandleChannelListShape?.({ defaults, event, setChannels });
  };

  defaultHandleChannelListShapeRef.current = (event: Event<SCG>) => {
    switch (event.type) {
      case 'message.new':
        defaults.handleMessageNew({
          allowNewMessagesFromUnfilteredChannels,
          customHandler: onMessageNewHandler,
          event,
          filters,
          lockChannelOrder,
          setChannels,
          sort,
        });
        break;
      case 'notification.message_new':
        defaults.handleNotificationMessageNew({
          allowNewMessagesFromUnfilteredChannels,
          customHandler: onMessageNew,
          event,
          filters,
          lockChannelOrder,
          setChannels,
          sort,
        });
        break;
      case 'notification.added_to_channel':
        defaults.handleNotificationAddedToChannel({
          allowNewMessagesFromUnfilteredChannels,
          customHandler: onAddedToChannel,
          event,
          lockChannelOrder,
          setChannels,
          sort,
        });
        break;
      case 'notification.removed_from_channel':
        defaults.handleNotificationRemovedFromChannel({
          customHandler: onRemovedFromChannel,
          event,
          setChannels,
        });
        break;
      case 'channel.deleted':
        defaults.handleChannelDeleted({
          customHandler: onChannelDeleted,
          event,
          setChannels,
        });
        break;
      case 'channel.hidden':
        defaults.handleChannelHidden({
          customHandler: onChannelHidden,
          event,
          setChannels,
        });
        break;
      case 'channel.visible':
        defaults.handleChannelVisible({
          customHandler: onChannelVisible,
          event,
          filters,
          setChannels,
          sort,
        });
        break;
      case 'channel.truncated':
        defaults.handleChannelTruncated({
          customHandler: onChannelTruncated,
          event,
          setChannels,
        });
        break;
      case 'channel.updated':
        defaults.handleChannelUpdated({
          customHandler: onChannelUpdated,
          event,
          setChannels,
        });
        break;
      case 'user.presence.changed':
        defaults.handleUserPresenceChanged({ event, setChannels });
        break;
      case 'member.updated':
        defaults.handleMemberUpdated({
          event,
          filters,
          lockChannelOrder,
          setChannels,
          sort,
        });
        break;
      default:
        break;
    }
  };

  const defaultFn = useCallback((e: Event<SCG>) => {
    defaultHandleChannelListShapeRef.current?.(e);
  }, []);

  const customFn = useMemo(() => {
    if (!customHandleChannelListShape) return null;
    return (e: Event<SCG>) => {
      customHandleChannelListShapeRef.current?.(e);
    };
  }, [customHandleChannelListShape]);

  return {
    customHandler: customFn,
    defaultHandler: defaultFn,
  };
};

export const useChannelListShape = <SCG extends ExtendableGenerics>(
  handler: (e: Event<SCG>) => void,
) => {
  const { client } = useChatContext<SCG>();

  useEffect(() => {
    const subscription = client.on('all', handler);

    return subscription.unsubscribe;
  }, [client, handler]);
};
