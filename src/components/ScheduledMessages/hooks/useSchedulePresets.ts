import { useMemo } from 'react';

import { useMessageComposerController } from '../../MessageComposer/hooks/useMessageComposerController';
import { getAvailableSchedulePresets, getChannelScheduleTimeBounds } from '../utils';

const NO_PRESETS: Date[] = [];

export const useSchedulePresets = (isMenuOpen: boolean) => {
  const { channel } = useMessageComposerController();

  const presets = useMemo(() => {
    if (!isMenuOpen) return NO_PRESETS;

    const now = new Date();

    return getAvailableSchedulePresets(now, getChannelScheduleTimeBounds(channel, now));
  }, [channel, isMenuOpen]);

  return presets;
};
