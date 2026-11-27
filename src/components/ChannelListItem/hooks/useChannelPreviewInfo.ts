import { useMemo } from 'react';
import type { Channel } from 'stream-chat';

import { useChatContext } from '../../../context';
import { useTranslationContext } from '../../../context/TranslationContext';
import { useStateStore } from '../../../store';
import {
  channelDisplayStateSelector,
  deriveChannelAvatarName,
  deriveChannelDisplayImage,
  deriveGroupChannelDisplayInfo,
} from '../channelDisplayState';
import type { GroupChannelDisplayInfo } from '../utils';
import { useChannelDisplayName } from './useChannelDisplayName';

const emptyGroupInfo: GroupChannelDisplayInfo = {
  members: [],
  overflowCount: undefined,
};

export type ChannelPreviewInfoParams = {
  /** Channel to read display info from. Without one, only the overrides give a title and image. */
  channel?: Channel;
  /** Image to render instead of the channel image. */
  overrideImage?: string;
  /** Title to render instead of the channel display name. Also the avatar name. */
  overrideTitle?: string;
};

/**
 * The title, image and group members a channel preview shows. Derived from the channel's `data`
 * and `members`, so a preview re-renders only when its own channel changes.
 *
 * - `displayTitle`: `overrideTitle`, else the name from `useChannelDisplayName`, else the translated
 *   "Unnamed channel". Undefined only without a channel and override.
 *
 * The channel avatar in the list row, the channel header and channel details is built from it, in
 * this order: `displayImage`; for a group, the `groupChannelDisplayInfo` members; the initials of
 * `avatarName`; the person icon for a DM, the people icon for a group (`isGroupChannel`).
 * - `avatarName`: `overrideTitle`, else the channel's `name`, else in a DM the other member's name.
 *   Never an ID or a placeholder title.
 * - `isGroupChannel`: whether the channel has more than two members.
 */
export const useChannelPreviewInfo = (props: ChannelPreviewInfoParams) => {
  const { channel, overrideImage, overrideTitle } = props;
  const { client } = useChatContext();
  const { t } = useTranslationContext();
  const unnamedChannelTitle = t('common.unnamedChannel.text', 'Unnamed channel');

  const channelDisplayName = useChannelDisplayName(channel);
  const displayTitle =
    overrideTitle ?? (channel ? (channelDisplayName ?? unnamedChannelTitle) : undefined);

  const displayState = useStateStore(channel?.state, channelDisplayStateSelector);
  const currentUserId = client.userID ?? undefined;

  const avatarName = useMemo(
    () =>
      overrideTitle ??
      (displayState ? deriveChannelAvatarName(displayState, currentUserId) : undefined),
    [currentUserId, displayState, overrideTitle],
  );
  const isGroupChannel = !!displayState && Object.keys(displayState.members).length > 2;

  const displayImage = useMemo(
    () =>
      overrideImage ??
      (displayState ? deriveChannelDisplayImage(displayState, currentUserId) : undefined),
    [currentUserId, displayState, overrideImage],
  );
  const groupChannelDisplayInfo = useMemo(
    () => (displayState && deriveGroupChannelDisplayInfo(displayState)) ?? emptyGroupInfo,
    [displayState],
  );

  return useMemo(
    () => ({
      avatarName,
      displayImage,
      displayTitle,
      groupChannelDisplayInfo,
      isGroupChannel,
    }),
    [avatarName, displayImage, displayTitle, groupChannelDisplayInfo, isGroupChannel],
  );
};
