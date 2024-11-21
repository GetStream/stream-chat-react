// const defaults = useChannelListShapeDefaults();

import { Dispatch, SetStateAction, useCallback, useEffect, useMemo, useRef } from 'react';
import { Channel, Event, ExtendableGenerics } from 'stream-chat';
import uniqBy from 'lodash.uniqby';

import { isChannelPinned } from '.';
import { findLastPinnedChannelIndex, moveChannelUpwards } from '../utils';
import { useChatContext } from '../../../context';
import { getChannel } from '../../../utils';
import { ChannelListProps } from '../ChannelList';

type SetChannels<SCG extends ExtendableGenerics> = Dispatch<SetStateAction<Channel<SCG>[]>>;

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
    considerPinnedChannels: boolean;
    lockChannelOrder: boolean;
  };

type HandleNotificationMessageNewParameters<SCG extends ExtendableGenerics> = BaseParameters<SCG> &
  RepeatedParameters<SCG> & {
    allowNewMessagesFromUnfilteredChannels: boolean;
    considerPinnedChannels: boolean;
    lockChannelOrder: boolean;
  };

type HandleNotificationRemovedFromChannelParameters<SCG extends ExtendableGenerics> =
  BaseParameters<SCG> & RepeatedParameters<SCG>;

type HandleNotificationAddedToChannelParameters<SCG extends ExtendableGenerics> =
  BaseParameters<SCG> &
    RepeatedParameters<SCG> & {
      allowNewMessagesFromUnfilteredChannels: boolean;
      considerPinnedChannels: boolean;
      lockChannelOrder: boolean;
    };

type HandleMemberUpdatedParameters<SCG extends ExtendableGenerics> = BaseParameters<SCG> & {
  considerPinnedChannels: boolean;
  lockChannelOrder: boolean;
};

type HandleChannelDeletedParameters<SCG extends ExtendableGenerics> = BaseParameters<SCG> &
  RepeatedParameters<SCG>;

type HandleChannelHiddenParameters<SCG extends ExtendableGenerics> = BaseParameters<SCG> &
  RepeatedParameters<SCG>;

type HandleChannelVisibleParameters<SCG extends ExtendableGenerics> = BaseParameters<SCG> &
  RepeatedParameters<SCG>;

type HandleChannelTruncatedParameters<SCG extends ExtendableGenerics> = BaseParameters<SCG> &
  RepeatedParameters<SCG>;

type HandleChannelUpdatedParameters<SCG extends ExtendableGenerics> = BaseParameters<SCG> &
  RepeatedParameters<SCG>;

type HandleUserPresenceChangedParameters<SCG extends ExtendableGenerics> = BaseParameters<SCG>;

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
      considerPinnedChannels,
      customHandler,
      event,
      lockChannelOrder,
      setChannels,
    }: HandleMessageNewParameters<SCG>) => {
      if (typeof customHandler === 'function') {
        return customHandler(setChannels, event);
      }

      setChannels((channels) => {
        const targetChannelIndex = channels.findIndex((channel) => channel.cid === event.cid);
        const targetChannelExistsWithinList = targetChannelIndex >= 0;

        const isTargetChannelPinned = isChannelPinned({
          channel: channels[targetChannelIndex],
        });

        if (
          // target channel is pinned
          (isTargetChannelPinned && considerPinnedChannels) ||
          // list order is locked
          lockChannelOrder ||
          // target channel is not within the loaded list and loading from cache is disallowed
          (!targetChannelExistsWithinList && !allowNewMessagesFromUnfilteredChannels)
        ) {
          return channels;
        }

        // we either have the channel to move or we pull it from the cache (or instantiate) if it's allowed
        const channelToMove: Channel<SCG> | null =
          channels[targetChannelIndex] ??
          (allowNewMessagesFromUnfilteredChannels && event.channel_type
            ? client.channel(event.channel_type, event.channel_id)
            : null);

        if (channelToMove) {
          return moveChannelUpwards({
            channels,
            channelToMove,
            channelToMoveIndexWithinChannels: targetChannelIndex,
            considerPinnedChannels,
          });
        }

        return channels;
      });
    },
    [client],
  );

  const handleNotificationMessageNew = useCallback(
    async ({
      allowNewMessagesFromUnfilteredChannels,
      customHandler,
      event,
      setChannels,
    }: HandleNotificationMessageNewParameters<SCG>) => {
      if (typeof customHandler === 'function') {
        return customHandler(setChannels, event);
      }

      if (allowNewMessagesFromUnfilteredChannels && event.channel?.type) {
        const channel = await getChannel({
          client,
          id: event.channel.id,
          type: event.channel.type,
        });
        setChannels((channels) => uniqBy([channel, ...channels], 'cid'));
      }
    },
    [client],
  );

  const handleNotificationAddedToChannel = useCallback(
    async ({
      allowNewMessagesFromUnfilteredChannels,
      customHandler,
      event,
      setChannels,
    }: HandleNotificationAddedToChannelParameters<SCG>) => {
      if (typeof customHandler === 'function') {
        return customHandler(setChannels, event);
      }

      if (allowNewMessagesFromUnfilteredChannels && event.channel?.type) {
        const channel = await getChannel({
          client,
          id: event.channel.id,
          members: event.channel.members?.reduce<string[]>((acc, { user, user_id }) => {
            const userId = user_id || user?.id;
            if (userId) {
              acc.push(userId);
            }
            return acc;
          }, []),
          type: event.channel.type,
        });
        setChannels((channels) => uniqBy([channel, ...channels], 'cid'));
      }
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

      setChannels((channels) => channels.filter((channel) => channel.cid !== event.channel?.cid));
    },
    [],
  );

  const handleMemberUpdated = useCallback(
    ({
      considerPinnedChannels,
      event,
      lockChannelOrder,
      setChannels,
    }: HandleMemberUpdatedParameters<SCG>) => {
      if (lockChannelOrder || !considerPinnedChannels) return;

      if (!event.member || !event.channel_type) return;
      // const member = e.member;
      const channelType = event.channel_type;
      const channelId = event.channel_id;

      setChannels((currentChannels) => {
        const targetChannel = client.channel(channelType, channelId);
        // assumes that channel instances are not changing
        const targetChannelIndex = currentChannels.indexOf(targetChannel);
        const targetChannelExistsWithinList = targetChannelIndex >= 0;

        const newChannels = [...currentChannels];

        if (targetChannelExistsWithinList) {
          newChannels.splice(targetChannelIndex, 1);
        }

        const lastPinnedChannelIndex = findLastPinnedChannelIndex({ channels: newChannels });
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
    async ({ customHandler, event, setChannels }: HandleChannelVisibleParameters<SCG>) => {
      if (typeof customHandler === 'function') {
        return customHandler(setChannels, event);
      }

      if (event.type && event.channel_type && event.channel_id) {
        const channel = await getChannel({
          client,
          id: event.channel_id,
          type: event.channel_type,
        });
        setChannels((channels) => uniqBy([channel, ...channels], 'cid'));
      }
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
        const channelIndex = channels.findIndex((channel) => channel.cid === event.channel?.cid);

        if (channelIndex > -1 && event.channel) {
          const newChannels = channels;
          newChannels[channelIndex].data = {
            ...event.channel,
            hidden: event.channel?.hidden ?? newChannels[channelIndex].data?.hidden,
            own_capabilities:
              event.channel?.own_capabilities ?? newChannels[channelIndex].data?.own_capabilities,
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
          const newChannel = channel; // dumb workaround for linter
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

type UseDefaultHandleChannelListShapeParameters<SCG extends ExtendableGenerics> = Required<
  Pick<ChannelListProps<SCG>, 'allowNewMessagesFromUnfilteredChannels' | 'lockChannelOrder'>
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
    considerPinnedChannels: boolean;
    customHandleChannelListShape?: (data: {
      defaults: ReturnType<typeof useChannelListShapeDefaults<SCG>>;
      event: Event<SCG>;
      setChannels: SetChannels<SCG>;
    }) => void;
    setChannels: SetChannels<SCG>;
  };

export const usePrepareShapeHandlers = <SCG extends ExtendableGenerics>({
  allowNewMessagesFromUnfilteredChannels,
  considerPinnedChannels,
  customHandleChannelListShape,
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
}: UseDefaultHandleChannelListShapeParameters<SCG>) => {
  const defaults = useChannelListShapeDefaults<SCG>();

  const defaultHandleChannelListShapeRef = useRef<(e: Event<SCG>) => void>();

  const customHandleChannelListShapeRef = useRef<(e: Event<SCG>) => void>();

  customHandleChannelListShapeRef.current = (event: Event<SCG>) => {
    customHandleChannelListShape?.({ defaults, event, setChannels });
  };

  defaultHandleChannelListShapeRef.current = (event: Event<SCG>) => {
    switch (event.type) {
      case 'message.new':
        defaults.handleMessageNew({
          allowNewMessagesFromUnfilteredChannels,
          considerPinnedChannels,
          customHandler: onMessageNewHandler,
          event,
          lockChannelOrder,
          setChannels,
        });
        break;
      case 'notification.message_new':
        defaults.handleNotificationMessageNew({
          allowNewMessagesFromUnfilteredChannels,
          considerPinnedChannels,
          customHandler: onMessageNew,
          event,
          lockChannelOrder,
          setChannels,
        });
        break;
      case 'notification.added_to_channel':
        defaults.handleNotificationAddedToChannel({
          allowNewMessagesFromUnfilteredChannels,
          considerPinnedChannels,
          customHandler: onAddedToChannel,
          event,
          lockChannelOrder,
          setChannels,
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
        defaults.handleChannelHidden({ customHandler: onChannelHidden, event, setChannels });
        break;
      case 'channel.visible':
        defaults.handleChannelVisible({ customHandler: onChannelVisible, event, setChannels });
        break;
      case 'channel.truncated':
        defaults.handleChannelTruncated({ customHandler: onChannelTruncated, event, setChannels });
        break;
      case 'channel.updated':
        defaults.handleChannelUpdated({ customHandler: onChannelUpdated, event, setChannels });
        break;
      case 'user.presence.changed':
        defaults.handleUserPresenceChanged({ event, setChannels });
        break;
      case 'member.updated':
        defaults.handleMemberUpdated({
          considerPinnedChannels,
          event,
          lockChannelOrder,
          setChannels,
        });
        break;
      default:
        console.log(`ChannelList[${event.type}]: no event handler registered`);
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
    defaultFn,
    customFn,
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
