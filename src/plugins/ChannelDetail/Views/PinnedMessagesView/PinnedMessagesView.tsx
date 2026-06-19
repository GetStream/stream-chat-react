import type { LocalMessage, MessageResponse, MessageSearchSource } from 'stream-chat';
import React, { useCallback, useMemo } from 'react';

import {
  useChannelActionContext,
  useChatContext,
  useModalContext,
  useTranslationContext,
} from '../../../../context';
import { getDateString, isDate } from '../../../../i18n/utils';
import { Avatar } from '../../../../components/Avatar';
import { InfiniteScrollPaginator } from '../../../../components/InfiniteScrollPaginator/InfiniteScrollPaginator';
import { ListItemLayout } from '../../../../components/ListItemLayout';
import { Prompt } from '../../../../components/Dialog';
import {
  SectionNavigatorHeader,
  type SectionNavigatorSectionContentProps,
} from '../../SectionNavigator';
import { ChannelDetailSearchInput } from '../../ChannelDetailSearchInput';
import { getUserDisplayName } from '../ChannelMembersView/ChannelMembersView.utils';
import { ChannelDetailListLoadingIndicator } from '../../ChannelDetailListLoadingIndicator';
import { PinnedMessagesEmptyList } from './PinnedMessagesEmptyList';
import { usePinnedMessagesSearch } from './usePinnedMessagesSearch';
import { useChannelDetailContext } from '../../ChannelDetailContext';
import { ChannelDetailEmptyList } from '../../ChannelDetailEmptyList';

type PinnedMessage = MessageResponse | LocalMessage;

const normalizeTimestamp = (timestamp: PinnedMessage['created_at']) => {
  if (!timestamp) return undefined;
  return isDate(timestamp) ? timestamp.toISOString() : timestamp;
};

const getPinnedMessagePreview = (
  message: PinnedMessage,
  t: ReturnType<typeof useTranslationContext>['t'],
) => {
  const text = message.text?.trim();
  if (text) return text;

  const attachment = message.attachments?.[0];
  const attachmentPreview =
    attachment?.title || attachment?.text || attachment?.fallback || attachment?.type;

  return attachmentPreview || t('Pinned message');
};

const PinnedMessageDate = ({ message }: { message: PinnedMessage }) => {
  const { t, tDateTimeParser } = useTranslationContext('PinnedMessageDate');
  const normalizedTimestamp = normalizeTimestamp(message.created_at);

  const when = useMemo(
    () =>
      getDateString({
        messageCreatedAt: normalizedTimestamp,
        t,
        tDateTimeParser,
        timestampTranslationKey: 'timestamp/ChannelDetailPinnedMessageTimestamp',
      }),
    [normalizedTimestamp, t, tDateTimeParser],
  );

  if (!when) return null;

  return (
    <time
      className='str-chat__channel-detail__pinned-messages-view__list-item__date'
      dateTime={normalizedTimestamp}
    >
      {when}
    </time>
  );
};

const PinnedMessagesViewItem = ({
  message,
  onSelect,
}: {
  message: PinnedMessage;
  onSelect: (message: PinnedMessage) => void;
}) => {
  const { t } = useTranslationContext();
  const displayName = getUserDisplayName(message.user ?? undefined);

  const LeadingSlot = useMemo(
    () =>
      function MessageAuthorAvatar() {
        return <Avatar imageUrl={message.user?.image} size='md' userName={displayName} />;
      },
    [displayName, message.user?.image],
  );

  const TrailingSlot = useMemo(
    () =>
      function MessageDate() {
        return <PinnedMessageDate message={message} />;
      },
    [message],
  );

  const rootProps = useMemo(
    () => ({
      className: 'str-chat__channel-detail__pinned-messages-view__list-item',
      onClick: () => onSelect(message),
    }),
    [message, onSelect],
  );

  return (
    <ListItemLayout
      LeadingSlot={LeadingSlot}
      RootElement='button'
      rootProps={rootProps}
      subtitle={getPinnedMessagePreview(message, t)}
      subtitleClassName='str-chat__channel-detail__pinned-messages-view__list-item__message-preview'
      title={displayName}
      TrailingSlot={TrailingSlot}
    />
  );
};

export type PinnedMessagesViewProps = SectionNavigatorSectionContentProps & {
  /** Custom message search source for pinned messages. */
  searchSource?: MessageSearchSource;
};

export const PinnedMessagesView: React.ComponentType<PinnedMessagesViewProps> = ({
  searchSource,
}) => {
  const { setActiveChannel } = useChatContext();
  const { t } = useTranslationContext();
  const { close } = useModalContext();
  // fixme: it is not right to couple the ChannelDetail view with Channel component. We need to have access to channel.messagePaginator.jumpToMessage()
  const { jumpToMessage } = useChannelActionContext();
  const { channel } = useChannelDetailContext();
  const {
    displayedMessages,
    handleSearchChange,
    hasPinnedMessages,
    hasSearchResultsLoaded,
    pinnedMessagesSearchSource,
  } = usePinnedMessagesSearch({ searchSource });

  const handleSelectMessage = useCallback(
    (message: PinnedMessage) => {
      setActiveChannel(channel);
      jumpToMessage(message.id);
      close();
    },
    [channel, close, jumpToMessage, setActiveChannel],
  );

  return (
    <div className='str-chat__channel-detail__pinned-messages-view'>
      <SectionNavigatorHeader
        close={close}
        description={t('Browse pinned messages')}
        title={t('Pinned messages')}
      />
      <Prompt.Body className='str-chat__channel-detail__pinned-messages-view__body'>
        {hasPinnedMessages && (
          <ChannelDetailSearchInput onSearchChange={handleSearchChange} />
        )}
        <InfiniteScrollPaginator
          className='str-chat__channel-detail__pinned-messages-view__list'
          loadNextOnScrollToBottom={
            hasPinnedMessages ? pinnedMessagesSearchSource.search : undefined
          }
        >
          {displayedMessages.length > 0 ? (
            displayedMessages.map((message) => (
              <PinnedMessagesViewItem
                key={message.id}
                message={message}
                onSelect={handleSelectMessage}
              />
            ))
          ) : !hasPinnedMessages ? (
            <PinnedMessagesEmptyList />
          ) : hasSearchResultsLoaded ? (
            <ChannelDetailEmptyList>{t('No messages found')}</ChannelDetailEmptyList>
          ) : null}
          <ChannelDetailListLoadingIndicator searchSource={pinnedMessagesSearchSource} />
        </InfiniteScrollPaginator>
      </Prompt.Body>
    </div>
  );
};
