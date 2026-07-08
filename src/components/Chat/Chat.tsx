import type { PropsWithChildren } from 'react';
import React, { useMemo } from 'react';
import type { StreamChat } from 'stream-chat';
import {
  ChannelPaginator,
  ChannelPaginatorsOrchestrator,
  ChannelSearchSource,
  MessageSearchSource,
  SearchController,
  UserSearchSource,
} from 'stream-chat';

import { NotificationAnnouncer as DefaultNotificationAnnouncer } from '../Accessibility';
import { useOpenedDialogCount } from '../Dialog';
import {
  getNotificationTargetPanels,
  NotificationConfigurationProvider,
  type NotificationDisplayFilter,
} from '../Notifications';
import { useChat } from './hooks/useChat';
import { useReportLostConnectionSystemNotification } from './hooks/useReportLostConnectionSystemNotification';
import { useCreateChatContext } from './hooks/useCreateChatContext';
import { useChannelsQueryState } from './hooks/useChannelsQueryState';
import type { CustomClasses } from '../../context/ChatContext';
import { ChatProvider } from '../../context/ChatContext';
import { useComponentContext } from '../../context/ComponentContext';
import { TranslationProvider } from '../../context/TranslationContext';
import {
  type MessageContextValue,
  modalDialogManagerId,
  ModalDialogManagerProvider,
} from '../../context';
import type { SupportedTranslations } from '../../i18n/types';
import type { Streami18n } from '../../i18n/Streami18n';

const NetworkConnectionNotificationReporter = () => {
  useReportLostConnectionSystemNotification();
  return null;
};

const createDefaultNotificationDisplayFilter =
  (modalManagerHasOpenDialog: boolean): NotificationDisplayFilter =>
  ({ notification, panel }) => {
    const targetPanels = getNotificationTargetPanels(notification);

    if (targetPanels.includes('modal')) {
      return panel === 'modal';
    }

    if (!modalManagerHasOpenDialog) return true;

    return panel === 'modal';
  };

const ModalNotificationConfiguration = ({
  children,
  notificationDisplayFilter,
}: PropsWithChildren<{
  notificationDisplayFilter?: NotificationDisplayFilter;
}>) => {
  const openedModalDialogCount = useOpenedDialogCount({
    dialogManagerId: modalDialogManagerId,
  });
  const modalManagerHasOpenDialog = openedModalDialogCount > 0;
  const displayFilter = useMemo<NotificationDisplayFilter>(
    () =>
      notificationDisplayFilter ??
      createDefaultNotificationDisplayFilter(modalManagerHasOpenDialog),
    [modalManagerHasOpenDialog, notificationDisplayFilter],
  );

  return (
    <NotificationConfigurationProvider displayFilter={displayFilter}>
      {children}
    </NotificationConfigurationProvider>
  );
};

export type ChatProps = {
  /** The StreamChat client object */
  client: StreamChat;
  /**
   * Orchestrator managing the channel-list paginators (data source + cross-list
   * ownership). Defaults to a single `channels:default` paginator over the current
   * user's channels.
   */
  channelPaginatorsOrchestrator?: ChannelPaginatorsOrchestrator;
  /** Object containing custom CSS classnames to override the library's default container CSS */
  customClasses?: CustomClasses;
  /** Sets the default fallback language for UI component translation, defaults to 'en' for English */
  defaultLanguage?: SupportedTranslations;
  /** Instance of Stream i18n */
  i18nInstance?: Streami18n;
  /** Instance of SearchController class that allows to control all the search operations. */
  searchController?: SearchController;
  /** Controls whether a notification can be displayed by a NotificationList. */
  notificationDisplayFilter?: NotificationDisplayFilter;
  /** Used for injecting className/s to the Channel and ChannelList components */
  theme?: string;
  /**
   * Windows 10 does not support country flag emojis out of the box. It chooses to render these emojis as characters instead. Stream
   * Chat can override this behavior by loading a custom web font that will render images instead (PNGs or SVGs depending on the platform).
   * Set this prop to true if you want to use these custom emojis for Windows users.
   *
   * Note: requires importing `stream-chat-react/css/v2/emoji-replacement.css` style sheet
   */
  useImageFlagEmojisOnWindows?: boolean;
} & Partial<Pick<MessageContextValue, 'isMessageAIGenerated'>>;

/**
 * Wrapper component for a StreamChat application. Chat needs to be placed around any other chat components
 * as it provides the ChatContext.
 */
export const Chat = (props: PropsWithChildren<ChatProps>) => {
  const {
    channelPaginatorsOrchestrator: customChannelPaginatorsOrchestrator,
    children,
    client,
    customClasses,
    defaultLanguage,
    i18nInstance,
    isMessageAIGenerated,
    notificationDisplayFilter,
    searchController: customChannelSearchController,
    theme = 'messaging light',
    useImageFlagEmojisOnWindows = false,
  } = props;

  const { getAppSettings, latestMessageDatesByChannels, mutes, translators } = useChat({
    client,
    defaultLanguage,
    i18nInstance,
  });

  const channelsQueryState = useChannelsQueryState();

  const searchController = useMemo(
    () =>
      customChannelSearchController ??
      new SearchController({
        sources: [
          new ChannelSearchSource(client),
          new UserSearchSource(client),
          new MessageSearchSource(client),
        ],
      }),
    [client, customChannelSearchController],
  );

  const channelPaginatorsOrchestrator = useMemo(
    () =>
      customChannelPaginatorsOrchestrator ??
      new ChannelPaginatorsOrchestrator({
        client,
        paginators: [
          new ChannelPaginator({
            client,
            filters: client.user?.id ? { members: { $in: [client.user.id] } } : {},
            id: 'channels:default',
            sort: { last_message_at: -1, pinned_at: 1, updated_at: -1 },
          }),
        ],
      }),
    [client, customChannelPaginatorsOrchestrator],
  );

  const chatContextValue = useCreateChatContext({
    channelPaginatorsOrchestrator,
    channelsQueryState,
    client,
    customClasses,
    getAppSettings,
    isMessageAIGenerated,
    latestMessageDatesByChannels,
    mutes,
    searchController,
    theme,
    useImageFlagEmojisOnWindows,
  });
  const { NotificationAnnouncer = DefaultNotificationAnnouncer } = useComponentContext();

  if (!translators.t) return null;

  return (
    <ChatProvider value={chatContextValue}>
      <TranslationProvider value={translators}>
        <ModalDialogManagerProvider>
          <ModalNotificationConfiguration
            notificationDisplayFilter={notificationDisplayFilter}
          >
            <NetworkConnectionNotificationReporter />
            <NotificationAnnouncer />
            {children}
          </ModalNotificationConfiguration>
        </ModalDialogManagerProvider>
      </TranslationProvider>
    </ChatProvider>
  );
};
