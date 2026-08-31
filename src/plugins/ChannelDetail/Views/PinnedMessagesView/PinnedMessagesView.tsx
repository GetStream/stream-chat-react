import type { LocalMessage, MessageResponse, MessageSearchSource } from 'stream-chat';
import React, { useCallback, useMemo } from 'react';

import {
  useComponentContext,
  useModalContext,
  useTranslationContext,
} from '../../../../context';
import { useChatViewNavigation } from '../../../SlotLayout';
import { getDateString } from '../../../../i18n/utils';
import { Avatar as DefaultAvatar } from '../../../../components/Avatar';
import { extractDisplayInfo as defaultExtractDisplayInfo } from '../../../../components/Avatar/utils';
import { ListItemLayout } from '../../../../components/ListItemLayout';
import { VirtualizedList } from '../../VirtualizedList';
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
import { nsToDate } from 'stream-chat';

type PinnedMessage = MessageResponse | LocalMessage;

const computeItemKey = (_: number, message: PinnedMessage) => message.id;

/**
 * A wire timestamp as an ISO string, for `getDateString` and the `dateTime` attribute. `nsToDate`
 * rather than `new Date`: a nanosecond value is out of Date's range.
 */
const normalizeTimestamp = (timestamp: PinnedMessage['created_at']) =>
  timestamp == null ? undefined : nsToDate(timestamp).toISOString();

const getPinnedMessagePreview = (
  message: PinnedMessage,
  t: ReturnType<typeof useTranslationContext>['t'],
) => {
  const text = message.text?.trim();
  if (text) return text;

  const attachment = message.attachments?.[0];
  const attachmentPreview =
    attachment?.title || attachment?.text || attachment?.fallback || attachment?.type;

  return (
    attachmentPreview ||
    t('channelDetail.pinnedMessagesView.pinnedMessage.label', 'Pinned message')
  );
};

const PinnedMessageDate = ({ message }: { message: PinnedMessage }) => {
  const { t, tDateTimeParser } = useTranslationContext();
  const normalizedTimestamp = normalizeTimestamp(message.created_at);

  const when = useMemo(
    () =>
      getDateString({
        messageCreatedAt: normalizedTimestamp,
        t,
        tDateTimeParser,
        timestampTranslationKey: 'timestamp.ChannelDetailPinnedMessageTimestamp',
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
  const { Avatar = DefaultAvatar, extractDisplayInfo = defaultExtractDisplayInfo } =
    useComponentContext();
  const displayName = getUserDisplayName(message.user ?? undefined);

  const LeadingSlot = useMemo(
    () =>
      function MessageAuthorAvatar() {
        const displayInfo = extractDisplayInfo({ user: message.user ?? undefined });

        return <Avatar {...displayInfo} size='md' />;
      },
    [Avatar, extractDisplayInfo, message.user],
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
  const { open } = useChatViewNavigation();
  const { t } = useTranslationContext();
  const { close } = useModalContext();
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
      // Selection is one navigation model: open the channel into a layout slot.
      open({ key: channel.cid ?? undefined, kind: 'channel', source: channel });
      // MERGE-RECONCILE: the deleted ChannelActionContext.jumpToMessage was replaced by the
      // channel's messagePaginator (PR #2909 / stream-chat message-paginator API).
      void channel.messagePaginator.jumpToMessage(message.id);
      close();
    },
    [channel, close, open],
  );

  const renderItem = useCallback(
    (_: number, message: PinnedMessage) => (
      <PinnedMessagesViewItem message={message} onSelect={handleSelectMessage} />
    ),
    [handleSelectMessage],
  );

  const EmptyPlaceholder = useMemo(
    () =>
      function PinnedMessagesEmptyPlaceholder() {
        if (!hasPinnedMessages) return <PinnedMessagesEmptyList />;
        if (hasSearchResultsLoaded)
          return (
            <ChannelDetailEmptyList>
              {t(
                'channelDetail.pinnedMessagesView.noMessagesFound.text',
                'No messages found',
              )}
            </ChannelDetailEmptyList>
          );
        return null;
      },
    [hasPinnedMessages, hasSearchResultsLoaded, t],
  );

  const Footer = useMemo(
    () =>
      function PinnedMessagesListFooter() {
        return (
          <ChannelDetailListLoadingIndicator searchSource={pinnedMessagesSearchSource} />
        );
      },
    [pinnedMessagesSearchSource],
  );

  return (
    <div className='str-chat__channel-detail__pinned-messages-view'>
      <SectionNavigatorHeader
        close={close}
        description={t(
          'channelDetail.pinnedMessagesView.browsePinnedMessages.description',
          'Browse pinned messages',
        )}
        title={t(
          'channelDetail.pinnedMessagesView.pinnedMessages.title',
          'Pinned messages',
        )}
      />
      <Prompt.Body className='str-chat__channel-detail__pinned-messages-view__body'>
        {hasPinnedMessages && (
          <ChannelDetailSearchInput onSearchChange={handleSearchChange} />
        )}
        <VirtualizedList
          className='str-chat__channel-detail__pinned-messages-view__list'
          computeItemKey={computeItemKey}
          data={displayedMessages}
          EmptyPlaceholder={EmptyPlaceholder}
          Footer={Footer}
          itemContent={renderItem}
          loadNext={hasPinnedMessages ? pinnedMessagesSearchSource.search : undefined}
        />
      </Prompt.Body>
    </div>
  );
};
