import type { LocalMessage, MessageResponse } from 'stream-chat';
import React, { useMemo } from 'react';

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
} from '../../../../components/SectionNavigator';
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

export type PinnedMessagesViewProps = SectionNavigatorSectionContentProps;

export const PinnedMessagesView: React.ComponentType<PinnedMessagesViewProps> = () => {
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
  } = usePinnedMessagesSearch();

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
            displayedMessages.map((message) => {
              const displayName = getUserDisplayName(message.user ?? undefined);

              return (
                <ListItemLayout
                  key={message.id}
                  LeadingSlot={() => (
                    <Avatar
                      imageUrl={message.user?.image}
                      size='md'
                      userName={displayName}
                    />
                  )}
                  RootElement='button'
                  rootProps={{
                    className:
                      'str-chat__channel-detail__pinned-messages-view__list-item',
                    onClick: () => {
                      setActiveChannel(channel);
                      jumpToMessage(message.id);
                      close();
                    },
                  }}
                  subtitle={getPinnedMessagePreview(message, t)}
                  subtitleClassName='str-chat__channel-detail__pinned-messages-view__list-item__message-preview'
                  title={displayName}
                  TrailingSlot={() => <PinnedMessageDate message={message} />}
                />
              );
            })
          ) : hasSearchResultsLoaded ? (
            <ChannelDetailEmptyList>{t('No messages found')}</ChannelDetailEmptyList>
          ) : (
            <PinnedMessagesEmptyList />
          )}
          <ChannelDetailListLoadingIndicator searchSource={pinnedMessagesSearchSource} />
        </InfiniteScrollPaginator>
      </Prompt.Body>
    </div>
  );
};
