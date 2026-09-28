import React from 'react';

import {
  useChannelInstanceContext,
  useComponentContextIcons,
  useTranslationContext,
  useWorkspaceNavigation,
  useWorkspacePanel,
} from '../../context';
import { Button } from './Button';
import { useThreadContext } from '../Threads/ThreadContext';
import { useCloseThread } from '../Threads/hooks/useCloseThread';

// The header these buttons sit in belongs to the thread in context when there is one (a thread
// panel), otherwise to the channel in context. The list headers share the slots too and have
// neither, so there the buttons render nothing.

/**
 * Steps back from the channel or thread whose header renders it: removes it from its panel,
 * revealing what it is stacked over. Renders nothing when there is nothing beneath.
 */
export const WorkspaceNavigationBackButton = () => {
  const { IconArrowLeft } = useComponentContextIcons();
  const { t } = useTranslationContext();
  const { canGoBack, goBack } = useWorkspaceNavigation();
  const panel = useWorkspacePanel();
  const thread = useThreadContext();
  const { channel } = useChannelInstanceContext();
  const key = thread ? thread.id : channel?.cid;

  if (key === undefined || !canGoBack(key, panel)) return null;

  return (
    <Button
      appearance='ghost'
      aria-label={t('common.back.label', 'Back')}
      circular
      className={
        thread
          ? 'str-chat__thread-header__back-button'
          : 'str-chat__channel-header__back-button'
      }
      data-testid={thread ? 'thread-header-back-button' : 'channel-header-back-button'}
      onClick={(event) => goBack(key, { event, panel })}
      size='md'
      variant='secondary'
    >
      <IconArrowLeft />
    </Button>
  );
};

const CloseThreadButton = () => {
  const { IconXmark } = useComponentContextIcons();
  const { t } = useTranslationContext();
  const { isThreadDismissable } = useWorkspaceNavigation();
  const panel = useWorkspacePanel();
  const thread = useThreadContext();
  // Closes in the panel it renders in; `useCloseThread` passes that panel along.
  const closeThread = useCloseThread();

  // Hidden for the threads view's primary thread, which is the main panel — you switch views
  // rather than close it.
  if (!isThreadDismissable(thread?.id, panel)) return null;

  return (
    <Button
      appearance='ghost'
      aria-label={t('thread.header.closeThread.ariaLabel', 'Close thread')}
      circular
      className='str-chat__close-thread-button'
      data-testid='close-thread-button'
      onClick={(event) => closeThread({ event })}
      size='md'
      variant='secondary'
    >
      <IconXmark />
    </Button>
  );
};

const CloseChannelButton = ({ cid }: { cid: string }) => {
  const { IconXmark } = useComponentContextIcons();
  const { t } = useTranslationContext();
  const { closeChannel, isChannelDismissable } = useWorkspaceNavigation();
  const panel = useWorkspacePanel();

  // Shown for a channel opened beside another one; the primary channel panel stays open.
  if (!isChannelDismissable(cid, panel)) return null;

  return (
    <Button
      appearance='ghost'
      aria-label={t('channelHeader.closeChannel.ariaLabel', 'Close channel')}
      circular
      className='str-chat__close-channel-button'
      data-testid='close-channel-button'
      onClick={(event) => closeChannel(cid, { event, panel })}
      size='md'
      variant='secondary'
    >
      <IconXmark />
    </Button>
  );
};

/**
 * Closes the whole panel of the channel or thread whose header renders it, with everything stacked
 * in it. Renders nothing for a panel that cannot be dismissed, such as the primary channel.
 */
export const WorkspaceNavigationCloseButton = () => {
  const thread = useThreadContext();
  const { channel } = useChannelInstanceContext();

  if (thread) return <CloseThreadButton />;
  if (channel?.cid) return <CloseChannelButton cid={channel.cid} />;
  return null;
};
