import { useEffect, useMemo, useState } from 'react';
import { SkipNavigation } from 'stream-chat-react';

import {
  CHANNEL_LIST_TARGET_ID,
  CHANNEL_MESSAGE_COMPOSER_TEXTAREA_TARGET_ID,
  CHANNELS_SELECTOR_BUTTON_TARGET_QUERY,
} from '../ChatLayout/Panels.tsx';

export const CHAT_SKIP_NAVIGATION_TARGET_ID = 'app-chat-skip-navigation';

const getSkipNavigationLinkLabel = (targetId: string) => {
  if (targetId === CHANNEL_MESSAGE_COMPOSER_TEXTAREA_TARGET_ID) {
    return 'Skip to message composer';
  }
  if (targetId === CHANNEL_LIST_TARGET_ID) {
    return 'Skip to channel list';
  }

  return 'Skip to sidebar';
};

export const ChatSkipNavigation = () => {
  const [channelsSelectorButtonTargetId, setChannelsSelectorButtonTargetId] = useState<
    string | null
  >(null);

  useEffect(() => {
    const syncChannelsSelectorButtonTargetId = () => {
      const channelsSelectorButton = document.querySelector<HTMLElement>(
        CHANNELS_SELECTOR_BUTTON_TARGET_QUERY,
      );
      setChannelsSelectorButtonTargetId(channelsSelectorButton?.id ?? null);
    };

    syncChannelsSelectorButtonTargetId();

    const observer = new MutationObserver(syncChannelsSelectorButtonTargetId);
    observer.observe(document.body, {
      attributes: true,
      attributeFilter: ['id'],
      childList: true,
      subtree: true,
    });

    return () => observer.disconnect();
  }, []);

  const targetIds = useMemo(() => {
    const skipTargets = [
      CHANNEL_MESSAGE_COMPOSER_TEXTAREA_TARGET_ID,
      CHANNEL_LIST_TARGET_ID,
    ];

    if (channelsSelectorButtonTargetId) {
      skipTargets.push(channelsSelectorButtonTargetId);
    }

    return skipTargets;
  }, [channelsSelectorButtonTargetId]);

  return (
    <nav aria-label='Chat quick navigation' id={CHAT_SKIP_NAVIGATION_TARGET_ID}>
      <SkipNavigation getLinkLabel={getSkipNavigationLinkLabel} targetIds={targetIds} />
    </nav>
  );
};
