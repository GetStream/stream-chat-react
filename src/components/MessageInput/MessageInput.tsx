import React, { PropsWithChildren } from 'react';
import type { Message } from 'stream-chat';

import { DefaultTriggerProvider } from './DefaultTriggerProvider';
import { MessageInputFlat } from './MessageInputFlat';

import { useCooldownTimer } from './hooks/useCooldownTimer';
import { useCreateMessageInputContext } from './hooks/useCreateMessageInputContext';
import { FileUpload, ImageUpload, useMessageInputState } from './hooks/useMessageInputState';

import { StreamMessage, useChannelStateContext } from '../../context/ChannelStateContext';
import { useComponentContext } from '../../context/ComponentContext';
import { MessageInputContextProvider } from '../../context/MessageInputContext';

import type { Channel, SendFileAPIResponse } from 'stream-chat';

import type { SearchQueryParams } from '../ChannelSearch/hooks/useChannelSearch';
import type { MessageToSend } from '../../context/ChannelActionContext';

import type { CustomTrigger, DefaultStreamChatGenerics } from '../../types/types';

export type MessageInputProps<
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
  V extends CustomTrigger = CustomTrigger
> = {
  /** Additional props to be passed to the underlying `AutoCompleteTextarea` component, [available props](https://www.npmjs.com/package/react-textarea-autosize) */
  additionalTextareaProps?: React.TextareaHTMLAttributes<HTMLTextAreaElement>;
  /** Function to clear the editing state while editing a message */
  clearEditingState?: () => void;
  /** If true, picking an emoji from the `EmojiPicker` component will close the picker */
  closeEmojiPickerOnClick?: boolean;
  /** If true, disables the text input */
  disabled?: boolean;
  /** If true, the suggestion list will not display and autocomplete @mentions. Default: false. */
  disableMentions?: boolean;
  /** Function to override the default file upload request */
  doFileUploadRequest?: (
    file: FileUpload['file'],
    channel: Channel<StreamChatGenerics>,
  ) => Promise<SendFileAPIResponse>;
  /** Function to override the default image upload request */
  doImageUploadRequest?: (
    file: ImageUpload['file'],
    channel: Channel<StreamChatGenerics>,
  ) => Promise<SendFileAPIResponse>;
  /** Custom error handler function to be called with a file/image upload fails */
  errorHandler?: (
    error: Error,
    type: string,
    file: (FileUpload | ImageUpload)['file'] & { id?: string },
  ) => void;
  /** If true, focuses the text input on component mount */
  focus?: boolean;
  /** Generates the default value for the underlying textarea element. The function's return value takes precedence before additionalTextareaProps.defaultValue. */
  getDefaultValue?: () => string | string[];
  /** If true, expands the text input vertically for new lines */
  grow?: boolean;
  /** Custom UI component handling how the message input is rendered, defaults to and accepts the same props as [MessageInputFlat](https://github.com/GetStream/stream-chat-react/blob/master/src/components/MessageInput/MessageInputFlat.tsx) */
  Input?: React.ComponentType<MessageInputProps<StreamChatGenerics, V>>;
  /** Max number of rows the underlying `textarea` component is allowed to grow */
  maxRows?: number;
  /** If true, the suggestion list will search all app users for an @mention, not just current channel members/watchers. Default: false. */
  mentionAllAppUsers?: boolean;
  /** Object containing filters/sort/options overrides for an @mention user query */
  mentionQueryParams?: SearchQueryParams<StreamChatGenerics>['userFilters'];
  /** If provided, the existing message will be edited on submit */
  message?: StreamMessage<StreamChatGenerics>;
  /** If true, disables file uploads for all attachments except for those with type 'image'. Default: false */
  noFiles?: boolean;
  /** Function to override the default submit handler */
  overrideSubmitHandler?: (
    message: MessageToSend<StreamChatGenerics>,
    channelCid: string,
    customMessageData?: Partial<Message<StreamChatGenerics>>,
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
  useMentionsTransliteration?: boolean;
};

const MessageInputProvider = <
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
  V extends CustomTrigger = CustomTrigger
>(
  props: PropsWithChildren<MessageInputProps<StreamChatGenerics, V>>,
) => {
  const cooldownTimerState = useCooldownTimer<StreamChatGenerics>();
  const messageInputState = useMessageInputState<StreamChatGenerics, V>(props);

  const messageInputContextValue = useCreateMessageInputContext<StreamChatGenerics, V>({
    ...cooldownTimerState,
    ...messageInputState,
    ...props,
  });

  return (
    <MessageInputContextProvider<StreamChatGenerics, V> value={messageInputContextValue}>
      {props.children}
    </MessageInputContextProvider>
  );
};

const UnMemoizedMessageInput = <
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
  V extends CustomTrigger = CustomTrigger
>(
  props: MessageInputProps<StreamChatGenerics, V>,
) => {
  const { Input: PropInput } = props;

  const { dragAndDropWindow } = useChannelStateContext<StreamChatGenerics>();
  const { Input: ContextInput, TriggerProvider = DefaultTriggerProvider } = useComponentContext<
    StreamChatGenerics,
    V
  >('MessageInput');

  const Input = PropInput || ContextInput || MessageInputFlat;

  if (dragAndDropWindow)
    return (
      <>
        <TriggerProvider>
          <Input />
        </TriggerProvider>
      </>
    );

  return (
    <MessageInputProvider {...props}>
      <TriggerProvider>
        <Input />
      </TriggerProvider>
    </MessageInputProvider>
  );
};

/**
 * A high level component that has provides all functionality to the Input it renders.
 */
export const MessageInput = React.memo(UnMemoizedMessageInput) as typeof UnMemoizedMessageInput;
