import type { PropsWithChildren } from 'react';
import React, { useEffect, useMemo } from 'react';
import type { StreamChat } from 'stream-chat';
import {
  ChannelSearchSource,
  MessageSearchSource,
  SearchController,
  UserSearchSource,
} from 'stream-chat';

import {
  AriaLiveAnnouncerProvider,
  AriaLiveOutlet,
  NotificationAnnouncer as DefaultNotificationAnnouncer,
} from '../Accessibility';
import { useOpenedDialogCount } from '../Dialog';
import {
  getNotificationTargetPanels,
  NotificationConfigurationProvider,
  type NotificationDisplayFilter,
} from '../Notifications';
import { useChat } from './hooks/useChat';
import { useStreami18n } from '../../i18n/useStreami18n';
import { useReportLostConnectionSystemNotification } from './hooks/useReportLostConnectionSystemNotification';
import { useCreateChatContext } from './hooks/useCreateChatContext';
import type { CustomClasses } from '../../context/ChatContext';
import { SharedAudioPlaybackProvider } from '../AudioPlayback/WithAudioPlayback';
import { ChatProvider } from '../../context/ChatContext';
import { useComponentContext } from '../../context/ComponentContext';
import { TranslationProvider } from '../../context/TranslationContext';
import {
  type MessageContextValue,
  modalDialogManagerId,
  ModalDialogManagerProvider,
} from '../../context';
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
      // While a modal is open, modal-tagged notifications stay inside it.
      if (modalManagerHasOpenDialog) return panel === 'modal';
      // The emitting modal has closed (e.g. a dialog that closes before its confirmation arrives),
      // so its `modal` list is unmounted and the notification would render nowhere. Fall back to
      // its other target panels; `panel` is already one of the notification's targets.
      return panel !== 'modal';
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
  /** The Stream Chat client. */
  client: StreamChat;
  /** Custom class names that replace the default container class names. */
  customClasses?: CustomClasses;
  /** Translation instance. */
  i18nInstance?: Streami18n;
  /** Search controller. Defaults to one that searches channels, users and messages. */
  searchController?: SearchController;
  /** Controls whether a notification can be displayed by a `NotificationList`. */
  notificationDisplayFilter?: NotificationDisplayFilter;
  /** Class names added to root elements such as `Channel`. Defaults to `messaging light`. */
  theme?: string;
  /**
   * Renders country flag emojis as images for Windows users, whose platform shows them as letters.
   * Defaults to false. Requires the `stream-chat-react/css/emoji-replacement.css` style sheet.
   */
  useImageFlagEmojisOnWindows?: boolean;
} & Partial<Pick<MessageContextValue, 'isMessageAIGenerated'>>;

/** Provides the chat context to the Stream Chat components below it. */
export const Chat = (props: PropsWithChildren<ChatProps>) => {
  const {
    children,
    client,
    customClasses,
    i18nInstance,
    isMessageAIGenerated,
    notificationDisplayFilter,
    searchController: customChannelSearchController,
    theme = 'messaging light',
    useImageFlagEmojisOnWindows = false,
  } = props;

  const { getAppSettings, mutes } = useChat({ client });
  const translators = useStreami18n({ client, i18nInstance });

  const searchController = useMemo(
    () =>
      customChannelSearchController ??
      new SearchController({
        client,
        sources: [
          new ChannelSearchSource(client),
          new UserSearchSource(client),
          new MessageSearchSource(client),
        ],
      }),
    [client, customChannelSearchController],
  );

  // Only a controller created here is disposed; a passed-in one belongs to the app. StrictMode's
  // remount is safe because `registerSubscriptions()` takes back what `dispose()` released.
  useEffect(() => {
    if (customChannelSearchController) return;
    searchController.registerSubscriptions();
    return () => searchController.dispose();
  }, [customChannelSearchController, searchController]);

  const chatContextValue = useCreateChatContext({
    channelManager: client.channelManager,
    client,
    customClasses,
    getAppSettings,
    isMessageAIGenerated,
    mutes,
    searchController,
    theme,
    useImageFlagEmojisOnWindows,
  });
  const { NotificationAnnouncer = DefaultNotificationAnnouncer } = useComponentContext();

  return (
    <ChatProvider value={chatContextValue}>
      <TranslationProvider value={translators}>
        <AriaLiveAnnouncerProvider>
          <ModalDialogManagerProvider>
            <ModalNotificationConfiguration
              notificationDisplayFilter={notificationDisplayFilter}
            >
              <NetworkConnectionNotificationReporter />
              <NotificationAnnouncer />
              <SharedAudioPlaybackProvider>{children}</SharedAudioPlaybackProvider>
              <AriaLiveOutlet portal />
            </ModalNotificationConfiguration>
          </ModalDialogManagerProvider>
        </AriaLiveAnnouncerProvider>
      </TranslationProvider>
    </ChatProvider>
  );
};
