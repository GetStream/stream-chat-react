import React from 'react';

import { useChannel } from '../../context';
import { useTranslationContext } from '../../context/TranslationContext';
import { useStateStore } from '../../store';
import { useChannelConfig } from '../Channel/hooks/useChannelConfig';
import { useChannelPreviewInfo } from '../ChannelListItem/hooks/useChannelPreviewInfo';
import { useMessageComposerController } from '../MessageComposer/hooks/useMessageComposerController';
import { TypingIndicatorHeader } from '../TypingIndicator/TypingIndicatorHeader';
import { useThreadContext } from '../Threads';
import { useChatContext } from '../../context/ChatContext';
import { useComponentContext } from '../../context/ComponentContext';

import type { EventPayload, LocalMessage } from 'stream-chat';
import type { TextComposerState, ThreadState } from 'stream-chat';
import { Button } from '../Button';
import { IconXmark } from '../Icons';
import { useWorkspaceNavigation } from '../../context';

const threadStateSelector = ({ replyCount }: ThreadState) => ({ replyCount });
const textComposerTypingSelector = ({ typing }: TextComposerState) => ({ typing });

/** Fallback when channel has no display title: parent message author (name only). */
const displayNameFromParentMessage = (message: LocalMessage): string | undefined =>
  message.user?.name ?? undefined;

/** Subtitle: replyCount, threadDisplayName, defaultSubtitle (name · reply count), and when typing also TypingIndicatorHeader. */
const ThreadHeaderSubtitle = ({
  replyCount,
  threadDisplayName,
  threadList,
}: {
  replyCount: number | undefined;
  threadDisplayName: string | undefined;
  threadList: boolean;
}) => {
  const { t } = useTranslationContext();
  const channel = useChannel();
  const channelConfig = useChannelConfig({ cid: channel?.cid });
  const threadInstance = useThreadContext();
  const parentId = threadInstance?.id;
  const { client } = useChatContext();
  const messageComposer = useMessageComposerController();
  const { typing = {} } =
    useStateStore(messageComposer.textComposer?.state, textComposerTypingSelector) ?? {};
  const typingInThread = (Object.values(typing) as EventPayload<'typing.start'>[]).filter(
    ({ parent_id, user }) => user?.id !== client.user?.id && parent_id === parentId,
  );
  const hasTyping =
    channelConfig?.typingEvents.enabled !== false && typingInThread.length > 0;
  const replyCountText = t('common.replyCount.label', {
    count: replyCount ?? 0,
    defaultValue_one: '1 reply',
    defaultValue_other: '{{ count }} replies',
  });
  const defaultSubtitle = threadDisplayName
    ? `${threadDisplayName} · ${replyCountText}`
    : replyCountText;
  return (
    <div className='str-chat__thread-header-subtitle'>
      <span
        className='str-chat__subtitle-content-transition'
        key={hasTyping ? 'typing' : 'default'}
      >
        {hasTyping ? (
          <TypingIndicatorHeader threadList={threadList} />
        ) : (
          <>{defaultSubtitle}</>
        )}
      </span>
    </div>
  );
};

export type ThreadHeaderProps = {
  /** Callback for closing the thread */
  closeThread: (event?: React.BaseSyntheticEvent) => void;
  /** The thread parent message */
  thread: LocalMessage;
  /** Override the thread display title */
  overrideTitle?: string;
};

export const ThreadHeader = (props: ThreadHeaderProps) => {
  const { closeThread, overrideTitle, thread } = props;

  const { t } = useTranslationContext();
  const channel = useChannel();
  const { HeaderStartContent } = useComponentContext();
  const { isThreadDismissable, isThreadsView } = useWorkspaceNavigation();
  const { displayTitle: channelDisplayTitle } = useChannelPreviewInfo({ channel });

  const threadInstance = useThreadContext();
  // Show the close button for dismissable thread panels: reply threads in any non-threads view,
  // and secondary threads in the threads view. It is hidden for the threads view's primary thread,
  // which is the main panel — you switch views rather than close it.
  const showCloseButton = isThreadDismissable(threadInstance?.id);
  const { replyCount: replyCountThreadInstance } =
    useStateStore(threadInstance?.state, threadStateSelector) ?? {};

  const replyCount = threadInstance
    ? replyCountThreadInstance
    : thread
      ? (thread.reply_count ?? 0)
      : 0;

  // Subtitle: channel display title (from parent or hook), with override and fallback to parent message author
  const threadDisplayName =
    overrideTitle ??
    channelDisplayTitle ??
    displayNameFromParentMessage(thread) ??
    undefined;

  return (
    <div className='str-chat__thread-header'>
      <div className='str-chat__thread-header__start'>
        {isThreadsView && HeaderStartContent && <HeaderStartContent />}
      </div>
      <div className='str-chat__thread-header-details'>
        <div className='str-chat__thread-header-title'>
          {t('thread.header.thread.text', 'Thread')}
        </div>
        <ThreadHeaderSubtitle
          replyCount={replyCount}
          threadDisplayName={threadDisplayName}
          threadList
        />
      </div>
      {/* The close button releases the thread's slot, so it is shown for threads that live in
          a closable side panel: reply threads in any non-threads view, and secondary threads
          in the threads view. It is hidden for the threads view's primary thread (the main
          panel) — see `showCloseButton` above. */}
      {showCloseButton && (
        <div className='str-chat__thread-header__end'>
          <Button
            appearance='ghost'
            aria-label={t('thread.header.closeThread.ariaLabel', 'Close thread')}
            circular
            className='str-chat__close-thread-button'
            data-testid='close-thread-button'
            onClick={closeThread}
            size='md'
            variant='secondary'
          >
            <IconXmark />
          </Button>
        </div>
      )}
    </div>
  );
};
