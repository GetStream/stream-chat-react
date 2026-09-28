import React from 'react';

import { useChannel } from '../../context';
import { useTranslationContext } from '../../context/TranslationContext';
import { useStateStore } from '../../store';
import { useChannelPreviewInfo } from '../ChannelListItem/hooks/useChannelPreviewInfo';
import { useMessageComposerController } from '../MessageComposer/hooks/useMessageComposerController';
import { TypingIndicatorHeader } from '../TypingIndicator/TypingIndicatorHeader';
import { useThreadContext } from '../Threads';
import { useChatContext } from '../../context/ChatContext';

import type { EventPayload, LocalMessage } from 'stream-chat';
import type { TextComposerState, ThreadState } from 'stream-chat';
import { WorkspaceNavigationBackButton, WorkspaceNavigationCloseButton } from '../Button';
import type { ChannelConfig } from 'stream-chat';

const typingEventsStateSelector = ({ typingEvents }: ChannelConfig) => ({
  typingEventsEnabled: typingEvents.enabled,
});

const threadStateSelector = ({ parentMessage, replyCount }: ThreadState) => ({
  parentMessage,
  replyCount,
});
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
  const { typingEventsEnabled } =
    useStateStore(channel?.configState, typingEventsStateSelector) ?? {};
  const threadInstance = useThreadContext();
  const parentId = threadInstance?.id;
  const { client } = useChatContext();
  const messageComposer = useMessageComposerController();
  const { typing = {} } =
    useStateStore(messageComposer.textComposer?.state, textComposerTypingSelector) ?? {};
  const typingInThread = (Object.values(typing) as EventPayload<'typing.start'>[]).filter(
    ({ parent_id, user }) => user?.id !== client.user?.id && parent_id === parentId,
  );
  const hasTyping = typingEventsEnabled !== false && typingInThread.length > 0;
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
  /**
   * Rendered at the end of the header, after the avatar. Defaults to
   * `WorkspaceNavigationCloseButton`, the close button of a panel that can be dismissed; a component
   * passed here replaces it, and can render the button itself to keep it.
   */
  EndContent?: React.ComponentType;
  /**
   * Rendered at the start of the header. Defaults to `WorkspaceNavigationBackButton`, the back
   * button of a panel stacked over other content; a component passed here replaces it, and can
   * render the button itself to keep it.
   */
  StartContent?: React.ComponentType;
  /** Override the thread display title */
  overrideTitle?: string;
};

export const ThreadHeader = ({
  EndContent = WorkspaceNavigationCloseButton,
  overrideTitle,
  StartContent = WorkspaceNavigationBackButton,
}: ThreadHeaderProps) => {
  const { t } = useTranslationContext();
  const channel = useChannel();
  const { displayTitle: channelDisplayTitle } = useChannelPreviewInfo({ channel });

  const threadInstance = useThreadContext();
  const { parentMessage, replyCount: replyCountThreadInstance } =
    useStateStore(threadInstance?.state, threadStateSelector) ?? {};

  const replyCount = replyCountThreadInstance ?? 0;

  // Subtitle: channel display title, with override and fallback to the parent message author
  const threadDisplayName =
    overrideTitle ??
    channelDisplayTitle ??
    (parentMessage && displayNameFromParentMessage(parentMessage)) ??
    undefined;

  return (
    <div className='str-chat__thread-header'>
      <div className='str-chat__thread-header__start'>
        <StartContent />
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
      <div className='str-chat__thread-header__end'>
        <EndContent />
      </div>
    </div>
  );
};
