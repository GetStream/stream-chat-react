import { useMemo } from 'react';
import type { Channel, StateStore } from 'stream-chat';

import { useStateStore } from '../../../store';
import type { GroupChannelDisplayInfo } from '../utils';

export type ChannelPreviewInfoParams = {
  /** Channel to read display info from; when undefined, returns undefined display title/image */
  channel?: Channel;
  /** Manually set the image to render, defaults to the Channel image */
  overrideImage?: string;
  /** Set title manually */
  overrideTitle?: string;
};

/** ChannelState with reactive display and members stores (stream-chat-js) */
type ChannelStateWithStores = {
  displayStore?: {
    getLatestValue(): { displayName: string | null; displayImage: string | null };
  };
  membersStore?: {
    getLatestValue(): {
      members: Record<string, { user?: { name?: string; image?: string } }>;
    };
  };
};

const displayStoreSelector = (s: {
  displayName: string | null;
  displayImage: string | null;
}) => ({
  displayImage: s.displayImage,
  displayName: s.displayName,
});

type MembersState = {
  members: Record<string, { user?: { name?: string; image?: string } }>;
};

function buildGroupChannelDisplayInfo(
  s: MembersState | undefined,
): GroupChannelDisplayInfo {
  if (!s?.members) return { members: [], overflowCount: undefined };
  const memberList = (Object.values(s.members) as MembersState['members'][string][])
    .filter((m) => m.user?.name || m.user?.image)
    .map((m) => ({ imageUrl: m.user?.image, userName: m.user?.name }));
  if (memberList.length <= 2) return { members: [], overflowCount: undefined };
  return {
    members: memberList,
    overflowCount: memberList.length > 4 ? memberList.length - 2 : undefined,
  };
}

export const useChannelPreviewInfo = (props: ChannelPreviewInfoParams) => {
  const { channel, overrideImage, overrideTitle } = props;

  const channelState = (channel?.state ?? undefined) as
    | ChannelStateWithStores
    | undefined;

  const displayFromStore = useStateStore(
    (channelState?.displayStore ?? undefined) as
      | StateStore<{ displayName: string | null; displayImage: string | null }>
      | undefined,
    displayStoreSelector,
  );

  const groupChannelDisplayInfo = useStateStore(
    (channelState?.membersStore ?? undefined) as
      | StateStore<{
          members: Record<string, { user?: { name?: string; image?: string } }>;
        }>
      | undefined,
    buildGroupChannelDisplayInfo,
  );

  const displayTitleResolved =
    overrideTitle ?? displayFromStore?.displayName ?? undefined;
  const displayImageResolved =
    overrideImage ?? displayFromStore?.displayImage ?? undefined;

  return useMemo(
    () => ({
      displayImage: displayImageResolved,
      displayTitle: displayTitleResolved,
      groupChannelDisplayInfo,
    }),
    [displayImageResolved, displayTitleResolved, groupChannelDisplayInfo],
  );
};
