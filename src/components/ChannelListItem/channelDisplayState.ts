import type {
  Channel,
  ChannelDataState,
  ChannelMemberResponse,
  MembersState,
} from 'stream-chat';

import { extractDisplayInfo } from '../Avatar/utils';
import type { GroupChannelDisplayInfo, GroupChannelDisplayInfoMember } from './utils';

/** The channel state a channel's display name, image and group info are derived from. */
export type ChannelDisplayState = {
  data: Channel['data'];
  members: Record<string, ChannelMemberResponse>;
};

/**
 * Selects {@link ChannelDisplayState} from `channel.state`. The client replaces a member when that
 * user is updated, and `channel.data` changes on `channel.updated`, so a subscription with this
 * selector re-derives the display info only for the channels that changed.
 */
export const channelDisplayStateSelector = (
  state: ChannelDataState & MembersState,
): ChannelDisplayState => ({
  data: state.data,
  members: state.members,
});

/**
 * 1. data.custom.name
 * 2. DM (exactly 2 members): other member's name, then directMessageLabel
 * 3. Group (3+ members): comma-separated list of 2 other members' names (no ellipsis)
 * 4. undefined otherwise
 */
export const deriveChannelDisplayName = (
  { data, members }: ChannelDisplayState,
  directMessageLabel: string,
  currentUserId: string | undefined,
): string | undefined => {
  const name = data?.custom?.name;
  if (name && typeof name === 'string') return name;

  const memberList = Object.values(members);
  const otherMembers = memberList.filter((m) => m.user?.id !== currentUserId);

  if (memberList.length === 2 && otherMembers.length === 1) {
    return otherMembers[0].user?.name || directMessageLabel;
  }
  if (otherMembers.length >= 2) {
    const names = otherMembers
      .map((m) => m.user?.name)
      .filter(Boolean)
      .slice(0, 2) as string[];
    if (names.length > 0) return names.join(', ');
  }
  return undefined;
};

/** data.custom.image, or for a DM (2 members) the other member's user.image. */
export const deriveChannelDisplayImage = (
  { data, members }: ChannelDisplayState,
  currentUserId?: string,
): string | undefined => {
  const image = data?.custom?.image;
  if (image && typeof image === 'string') return image;

  const memberList = Object.values(members);
  if (memberList.length === 2) {
    const other = memberList.find((m) => m.user?.id !== currentUserId);
    const otherImage = other?.user?.image;
    if (otherImage && typeof otherImage === 'string') return otherImage;
  }
  return undefined;
};

/** The members shown for a group channel (3+ members); undefined for a DM or an empty channel. */
export const deriveGroupChannelDisplayInfo = ({
  members,
}: ChannelDisplayState): GroupChannelDisplayInfo | undefined => {
  const memberList = Object.values(members);
  if (memberList.length <= 2) return;

  const displayMembers: GroupChannelDisplayInfoMember[] = [];
  for (const member of memberList) {
    const { user } = member;
    if (!user?.name && !user?.image) continue;
    displayMembers.push(extractDisplayInfo(member));
  }
  return { members: displayMembers };
};
