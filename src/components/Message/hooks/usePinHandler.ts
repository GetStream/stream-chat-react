import { defaultPinPermissions } from '../utils';

import { useChannelStateContext } from '../../../context/ChannelStateContext';
import { useChatContext } from '../../../context/ChatContext';

import type { LocalMessage } from 'stream-chat';
import type { ReactEventHandler } from '../types';

// @deprecated in favor of `channelCapabilities` - TODO: remove in next major release
export type PinEnabledUserRoles<T extends string = string> = Partial<
  Record<T, boolean>
> & {
  admin?: boolean;
  anonymous?: boolean;
  channel_member?: boolean;
  channel_moderator?: boolean;
  guest?: boolean;
  member?: boolean;
  moderator?: boolean;
  owner?: boolean;
  user?: boolean;
};

// @deprecated in favor of `channelCapabilities` - TODO: remove in next major release
export type PinPermissions<
  T extends string = string,
  U extends string = string,
> = Partial<Record<T, PinEnabledUserRoles<U>>> & {
  commerce?: PinEnabledUserRoles<U>;
  gaming?: PinEnabledUserRoles<U>;
  livestream?: PinEnabledUserRoles<U>;
  messaging?: PinEnabledUserRoles<U>;
  team?: PinEnabledUserRoles<U>;
};

export const usePinHandler = (
  message: LocalMessage,
  // @deprecated in favor of `channelCapabilities` - TODO: remove in next major release
  _permissions: PinPermissions = defaultPinPermissions, // eslint-disable-line
) => {
  const { channelCapabilities = {} } = useChannelStateContext('usePinHandler');
  const { client } = useChatContext('usePinHandler');

  const canPin = !!channelCapabilities['pin-message'];

  const handlePin: ReactEventHandler = async (event) => {
    event.preventDefault();

    if (!message) return;

    if (!message.pinned) {
      await client.pinMessage(message);
    } else {
      await client.unpinMessage(message);
    }
  };

  return { canPin, handlePin };
};
