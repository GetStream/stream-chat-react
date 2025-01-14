import React, { PropsWithChildren, useMemo } from 'react';
import {
  ChannelSearchSource,
  MessageSearchSource,
  SearchController,
  UserSearchSource,
} from 'stream-chat';

import { useChat } from './hooks/useChat';
import { useCreateChatContext } from './hooks/useCreateChatContext';
import { useChannelsQueryState } from './hooks/useChannelsQueryState';

import { ChatProvider, CustomClasses } from '../../context/ChatContext';
import { TranslationProvider } from '../../context/TranslationContext';
import { WithComponents } from '../../context';

import type { StreamChat } from 'stream-chat';
import type { ChannelPropsForwardedToComponentContext } from '../Channel';
import type { ComponentContextValue } from '../../context';
import type { SupportedTranslations } from '../../i18n/types';
import type { Streami18n } from '../../i18n/Streami18n';
import type { CustomTrigger, DefaultStreamChatGenerics } from '../../types/types';

export type ChatPropsForwardedToComponentContext<
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
  V extends CustomTrigger = CustomTrigger
> = Pick<
  ComponentContextValue<StreamChatGenerics, V>,
  | 'ChannelAvatar'
  | 'Search'
  | 'SearchBar'
  | 'SearchResults'
  | 'SearchResultsHeader'
  | 'SearchResultsPresearch'
  | 'SearchSourceResultList'
  | 'SearchSourceResultListFooter'
  | 'SearchSourceResults'
  | 'SearchSourceResultsEmpty'
  | 'SearchSourceResultsHeader'
  | 'SearchSourceResultsLoadingIndicator'
>;

export type ChatProps<
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
  V extends CustomTrigger = CustomTrigger
> = ChatPropsForwardedToComponentContext<StreamChatGenerics, V> &
  ChannelPropsForwardedToComponentContext<StreamChatGenerics> & {
    /** The StreamChat client object */
    client: StreamChat<StreamChatGenerics>;
    /** Object containing custom CSS classnames to override the library's default container CSS */
    customClasses?: CustomClasses;
    /** Sets the default fallback language for UI component translation, defaults to 'en' for English */
    defaultLanguage?: SupportedTranslations;
    /** Instance of Stream i18n */
    i18nInstance?: Streami18n;
    /** Initial status of mobile navigation */
    initialNavOpen?: boolean;
    /** Instance of SearchController class that allows to control all the search operations. */
    searchController?: SearchController<StreamChatGenerics>;
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
  };

/**
 * Wrapper component for a StreamChat application. Chat needs to be placed around any other chat components
 * as it provides the ChatContext.
 */
export const Chat = <
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
  V extends CustomTrigger = CustomTrigger
>(
  props: PropsWithChildren<ChatProps<StreamChatGenerics, V>>,
) => {
  const {
    children,
    client,
    customClasses,
    defaultLanguage,
    i18nInstance,
    initialNavOpen = true,
    searchController: customChannelSearchController,
    theme = 'messaging light',
    useImageFlagEmojisOnWindows = false,
  } = props;

  const {
    channel,
    closeMobileNav,
    getAppSettings,
    latestMessageDatesByChannels,
    mutes,
    navOpen,
    openMobileNav,
    setActiveChannel,
    translators,
  } = useChat({ client, defaultLanguage, i18nInstance, initialNavOpen });

  const channelsQueryState = useChannelsQueryState();

  const searchController = useMemo(
    () =>
      customChannelSearchController ??
      new SearchController<StreamChatGenerics>({
        sources: [
          new ChannelSearchSource<StreamChatGenerics>(client),
          new UserSearchSource<StreamChatGenerics>(client),
          new MessageSearchSource<StreamChatGenerics>(client),
        ],
      }),
    [client, customChannelSearchController],
  );

  const chatContextValue = useCreateChatContext<StreamChatGenerics>({
    channel,
    channelsQueryState,
    client,
    closeMobileNav,
    customClasses,
    getAppSettings,
    latestMessageDatesByChannels,
    mutes,
    navOpen,
    openMobileNav,
    searchController,
    setActiveChannel,
    theme,
    useImageFlagEmojisOnWindows,
  });

  // @ts-expect-error
  const componentContextValue: Partial<ComponentContextValue> = useMemo(
    () => ({
      Attachment: props.Attachment,
      AttachmentPreviewList: props.AttachmentPreviewList,
      AttachmentSelector: props.AttachmentSelector,
      AttachmentSelectorInitiationButtonContents: props.AttachmentSelectorInitiationButtonContents,
      AudioRecorder: props.AudioRecorder,
      AutocompleteSuggestionItem: props.AutocompleteSuggestionItem,
      AutocompleteSuggestionList: props.AutocompleteSuggestionList,
      Avatar: props.Avatar,
      BaseImage: props.BaseImage,
      ChannelAvatar: props.ChannelAvatar,
      CooldownTimer: props.CooldownTimer,
      CustomMessageActionsList: props.CustomMessageActionsList,
      DateSeparator: props.DateSeparator,
      EditMessageInput: props.EditMessageInput,
      EmojiPicker: props.EmojiPicker,
      emojiSearchIndex: props.emojiSearchIndex,
      EmptyStateIndicator: props.EmptyStateIndicator,
      FileUploadIcon: props.FileUploadIcon,
      GiphyPreviewMessage: props.GiphyPreviewMessage,
      HeaderComponent: props.HeaderComponent,
      Input: props.Input,
      LinkPreviewList: props.LinkPreviewList,
      LoadingIndicator: props.LoadingIndicator,
      Message: props.Message,
      MessageActions: props.MessageActions,
      MessageBouncePrompt: props.MessageBouncePrompt,
      MessageDeleted: props.MessageDeleted,
      MessageListNotifications: props.MessageListNotifications,
      MessageNotification: props.MessageNotification,
      MessageOptions: props.MessageOptions,
      MessageRepliesCountButton: props.MessageRepliesCountButton,
      MessageStatus: props.MessageStatus,
      MessageSystem: props.MessageSystem,
      MessageTimestamp: props.MessageTimestamp,
      ModalGallery: props.ModalGallery,
      PinIndicator: props.PinIndicator,
      PollActions: props.PollActions,
      PollContent: props.PollContent,
      PollCreationDialog: props.PollCreationDialog,
      PollHeader: props.PollHeader,
      PollOptionSelector: props.PollOptionSelector,
      QuotedMessage: props.QuotedMessage,
      QuotedMessagePreview: props.QuotedMessagePreview,
      QuotedPoll: props.QuotedPoll,
      reactionOptions: props.reactionOptions,
      ReactionSelector: props.ReactionSelector,
      ReactionsList: props.ReactionsList,
      Search: props.Search,
      SearchBar: props.SearchBar,
      SearchResults: props.SearchResults,
      SearchResultsHeader: props.SearchResultsHeader,
      SearchResultsPresearch: props.SearchResultsPresearch,
      SearchSourceResultList: props.SearchSourceResultList,
      SearchSourceResultListFooter: props.SearchSourceResultListFooter,
      SearchSourceResults: props.SearchSourceResults,
      SearchSourceResultsEmpty: props.SearchSourceResultsEmpty,
      SearchSourceResultsHeader: props.SearchSourceResultsHeader,
      SearchSourceResultsLoadingIndicator: props.SearchSourceResultsLoadingIndicator,
      SendButton: props.SendButton,
      StartRecordingAudioButton: props.StartRecordingAudioButton,
      ThreadHead: props.ThreadHead,
      ThreadHeader: props.ThreadHeader,
      ThreadStart: props.ThreadStart,
      Timestamp: props.Timestamp,
      TriggerProvider: props.TriggerProvider,
      TypingIndicator: props.TypingIndicator,
      UnreadMessagesNotification: props.UnreadMessagesNotification,
      UnreadMessagesSeparator: props.UnreadMessagesSeparator,
      VirtualMessage: props.VirtualMessage,
    }),
    [
      props.Attachment,
      props.AttachmentPreviewList,
      props.AttachmentSelector,
      props.AttachmentSelectorInitiationButtonContents,
      props.AudioRecorder,
      props.AutocompleteSuggestionItem,
      props.AutocompleteSuggestionList,
      props.Avatar,
      props.BaseImage,
      props.ChannelAvatar,
      props.CooldownTimer,
      props.CustomMessageActionsList,
      props.DateSeparator,
      props.EditMessageInput,
      props.EmojiPicker,
      props.EmptyStateIndicator,
      props.FileUploadIcon,
      props.GiphyPreviewMessage,
      props.HeaderComponent,
      props.Input,
      props.LinkPreviewList,
      props.LoadingIndicator,
      props.Message,
      props.MessageActions,
      props.MessageBouncePrompt,
      props.MessageDeleted,
      props.MessageListNotifications,
      props.MessageNotification,
      props.MessageOptions,
      props.MessageRepliesCountButton,
      props.MessageStatus,
      props.MessageSystem,
      props.MessageTimestamp,
      props.ModalGallery,
      props.PinIndicator,
      props.PollActions,
      props.PollContent,
      props.PollCreationDialog,
      props.PollHeader,
      props.PollOptionSelector,
      props.QuotedMessage,
      props.QuotedMessagePreview,
      props.QuotedPoll,
      props.ReactionSelector,
      props.ReactionsList,
      props.Search,
      props.SearchBar,
      props.SearchResults,
      props.SearchResultsHeader,
      props.SearchResultsPresearch,
      props.SearchSourceResultList,
      props.SearchSourceResultListFooter,
      props.SearchSourceResults,
      props.SearchSourceResultsEmpty,
      props.SearchSourceResultsHeader,
      props.SearchSourceResultsLoadingIndicator,
      props.SendButton,
      props.StartRecordingAudioButton,
      props.ThreadHead,
      props.ThreadHeader,
      props.ThreadStart,
      props.Timestamp,
      props.TriggerProvider,
      props.TypingIndicator,
      props.UnreadMessagesNotification,
      props.UnreadMessagesSeparator,
      props.VirtualMessage,
      props.emojiSearchIndex,
      props.reactionOptions,
    ],
  );

  if (!translators.t) return null;

  return (
    <ChatProvider value={chatContextValue}>
      <TranslationProvider value={translators}>
        <WithComponents overrides={componentContextValue}>{children}</WithComponents>
      </TranslationProvider>
    </ChatProvider>
  );
};
