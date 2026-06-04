import { useMemo } from 'react';

import { useChatContext } from '../../../context/ChatContext';

export const useIsUserMuted = (targetUserId?: string) => {
  const { mutes } = useChatContext();

  return useMemo(
    () => !!targetUserId && mutes.some((mute) => mute.target.id === targetUserId),
    [mutes, targetUserId],
  );
};
