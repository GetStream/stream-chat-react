import React, { PropsWithChildren } from 'react';

import { DefaultTriggerProvider } from './DefaultTriggerProvider';
import { MessageInputFlat } from './MessageInputFlat';
import { useCooldownTimer } from './hooks/useCooldownTimer';
import { useCreateMessageInputContext } from './hooks/useCreateMessageInputContext';
import { useMessageInputState } from './hooks/useMessageInputState';
import { StreamMessage, useChannelStateContext } from '../../context/ChannelStateContext';
import {
  ComponentContextValue,
  useComponentContext,
} from '../../context/ComponentContext';
import { MessageInputContextProvider } from '../../context/MessageInputContext';
import { DialogManagerProvider } from '../../context';
import { useRegisterDropHandlers } from './WithDragAndDropUpload';
import { useStableId } from '../UtilityComponents/useStableId';

import type { Channel, Message, SendFileAPIResponse } from 'stream-chat';

import type { BaseLocalAttachmentMetadata, LocalAttachmentUploadMetadata } from './types';
import type { SearchQueryParams } from '../ChannelSearch/hooks/useChannelSearch';
import type { MessageToSend } from '../../context/ChannelActionContext';
import type {
  CustomTrigger,
  DefaultStreamChatGenerics,
  SendMessageOptions,
  UnknownType,
} from '../../types/types';
import type { URLEnrichmentConfig } from './hooks/useLinkPreviews';
import type { CustomAudioRecordingConfig } from '../MediaRecorder';

export type EmojiSearchIndexResult = {
  id: string;
  name: string;
  skins: Array<{ native: string }>;
  emoticons?: Array<string>;
  native?: string;
};

export interface EmojiSearchIndex<T extends UnknownType = UnknownType> {
  search: (
    query: string,
  ) =>
    | PromiseLike<Array<EmojiSearchIndexResult & T>>
    | Array<EmojiSearchIndexResult & T>
    | null;
}

export type MessageInputProps<
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
  V extends CustomTrigger = CustomTrigger,
> = {
  /** Additional props to be passed to the underlying `AutoCompleteTextarea` component, [available props](https://www.npmjs.com/package/react-textarea-autosize) */
  additionalTextareaProps?: React.TextareaHTMLAttributes<HTMLTextAreaElement>;
  /**
   * When enabled, recorded messages won’t be sent immediately.
   * Instead, they will “stack up” with other attachments in the message composer allowing the user to send multiple attachments as part of the same message.
   */
  asyncMessagesMultiSendEnabled?: boolean;
  /** Allows to configure the audio recording parameters for voice messages. */
  audioRecordingConfig?: CustomAudioRecordingConfig;
  /** Controls whether the users will be provided with the UI to record voice messages. */
  audioRecordingEnabled?: boolean;
  /** Function to clear the editing state while editing a message */
  clearEditingState?: () => void;
  /** If true, disables the text input */
  disabled?: boolean;
  /** If true, the suggestion list will not display and autocomplete @mentions. Default: false. */
  disableMentions?: boolean;
  /** Function to override the default file upload request */
  doFileUploadRequest?: (
    file: LocalAttachmentUploadMetadata['file'],
    channel: Channel<StreamChatGenerics>,
  ) => Promise<SendFileAPIResponse>;
  /** Function to override the default image upload request */
  doImageUploadRequest?: (
    file: LocalAttachmentUploadMetadata['file'],
    channel: Channel<StreamChatGenerics>,
  ) => Promise<SendFileAPIResponse>;
  /** Mechanism to be used with autocomplete and text replace features of the `MessageInput` component, see [emoji-mart `SearchIndex`](https://github.com/missive/emoji-mart#%EF%B8%8F%EF%B8%8F-headless-search) */
  emojiSearchIndex?: ComponentContextValue['emojiSearchIndex'];
  /** Custom error handler function to be called with a file/image upload fails */
  errorHandler?: (
    error: Error,
    type: string,
    file: LocalAttachmentUploadMetadata['file'] & BaseLocalAttachmentMetadata,
  ) => void;
  /** If true, focuses the text input on component mount */
  focus?: boolean;
  /** Generates the default value for the underlying textarea element. The function's return value takes precedence before additionalTextareaProps.defaultValue. */
  getDefaultValue?: () => string | string[];
  /** If true, expands the text input vertically for new lines */
  grow?: boolean;
  /** Allows to hide MessageInput's send button. */
  hideSendButton?: boolean;
  /** Custom UI component handling how the message input is rendered, defaults to and accepts the same props as [MessageInputFlat](https://github.com/GetStream/stream-chat-react/blob/master/src/components/MessageInput/MessageInputFlat.tsx) */
  Input?: React.ComponentType<MessageInputProps<StreamChatGenerics, V>>;
  /** Signals that the MessageInput is rendered in a message thread (Thread component) */
  isThreadInput?: boolean;
  /** Max number of rows the underlying `textarea` component is allowed to grow */
  maxRows?: number;
  /** If true, the suggestion list will search all app users for an @mention, not just current channel members/watchers. Default: false. */
  mentionAllAppUsers?: boolean;
  /** Object containing filters/sort/options overrides for an @mention user query */
  mentionQueryParams?: SearchQueryParams<StreamChatGenerics>['userFilters'];
  /** If provided, the existing message will be edited on submit */
  message?: StreamMessage<StreamChatGenerics>;
  /** Min number of rows the underlying `textarea` will start with. The `grow` on MessageInput prop has to be enabled for `minRows` to take effect. */
  minRows?: number;
  /** If true, disables file uploads for all attachments except for those with type 'image'. Default: false */
  noFiles?: boolean;
  /** Function to override the default submit handler */
  overrideSubmitHandler?: (
    message: MessageToSend<StreamChatGenerics>,
    channelCid: string,
    customMessageData?: Partial<Message<StreamChatGenerics>>,
    options?: SendMessageOptions,
  ) => Promise<void> | void;
  /** When replying in a thread, the parent message object */
  parent?: StreamMessage<StreamChatGenerics>;
  /** If true, triggers typing events on text input keystroke */
  publishTypingEvent?: boolean;
  /** If true, will use an optional dependency to support transliteration in the input for mentions, default is false. See: https://github.com/getstream/transliterate */
  /**
   * Currently, `Enter` is the default submission key and  `Shift`+`Enter` is the default combination for the new line.
   * If specified, this function overrides the default behavior specified previously.
   *
   * Example of default behaviour:
   * ```tsx
   * const defaultShouldSubmit = (event) => event.key === "Enter" && !event.shiftKey;
   * ```
   */
  shouldSubmit?: (event: KeyboardEvent) => boolean;
  /** Configuration parameters for link previews. */
  urlEnrichmentConfig?: URLEnrichmentConfig;
  useMentionsTransliteration?: boolean;
};

const MessageInputProvider = <
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
  V extends CustomTrigger = CustomTrigger,
>(
  props: PropsWithChildren<MessageInputProps<StreamChatGenerics, V>>,
) => {
  const cooldownTimerState = useCooldownTimer<StreamChatGenerics>();
  const messageInputState = useMessageInputState<StreamChatGenerics, V>(props);
  const { emojiSearchIndex } = useComponentContext('MessageInput');

  const messageInputContextValue = useCreateMessageInputContext<StreamChatGenerics, V>({
    ...cooldownTimerState,
    ...messageInputState,
    ...props,
    emojiSearchIndex: props.emojiSearchIndex ?? emojiSearchIndex,
  });

  // @ts-expect-error generics to be removed
  useRegisterDropHandlers(messageInputContextValue);

  return (
    <MessageInputContextProvider<StreamChatGenerics, V> value={messageInputContextValue}>
      {props.children}
    </MessageInputContextProvider>
  );
};

const UnMemoizedMessageInput = <
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
  V extends CustomTrigger = CustomTrigger,
>(
  props: MessageInputProps<StreamChatGenerics, V>,
) => {
  const { Input: PropInput } = props;

  const { dragAndDropWindow } = useChannelStateContext<StreamChatGenerics>();
  const { Input: ContextInput, TriggerProvider = DefaultTriggerProvider } =
    useComponentContext<StreamChatGenerics, V>('MessageInput');

  const id = useStableId();

  const Input = PropInput || ContextInput || MessageInputFlat;
  const dialogManagerId = props.isThreadInput
    ? `message-input-dialog-manager-thread-${id}`
    : `message-input-dialog-manager-${id}`;

  if (dragAndDropWindow)
    return (
      <DialogManagerProvider id={dialogManagerId}>
        <TriggerProvider>
          <Input />
        </TriggerProvider>
      </DialogManagerProvider>
    );

  return (
    <DialogManagerProvider id={dialogManagerId}>
      <MessageInputProvider {...props}>
        <TriggerProvider>
          <Input />
        </TriggerProvider>
      </MessageInputProvider>
    </DialogManagerProvider>
  );
};

/**
 * A high level component that has provides all functionality to the Input it renders.
 */
export const MessageInput = React.memo(
  UnMemoizedMessageInput,
) as typeof UnMemoizedMessageInput;
