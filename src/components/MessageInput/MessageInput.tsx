import React from 'react';

import { DefaultTriggerProvider } from './DefaultTriggerProvider';
import { MessageInputFlat } from './MessageInputFlat';

import { useCooldownTimer } from './hooks/useCooldownTimer';
import { useMessageInputState } from './hooks/useMessageInputState';
import { MessageInputContextProvider } from '../../context/MessageInputContext';
import { useComponentContext } from '../../context/ComponentContext';

import type { Attachment, Channel, SendFileAPIResponse, UserResponse } from 'stream-chat';

import type { FileUpload, ImageUpload } from './hooks/useMessageInputState';
import type { SearchQueryParams } from '../ChannelSearch/ChannelSearch';
import type { StreamMessage } from '../../context/ChannelStateContext';

import type {
  CustomTrigger,
  DefaultAttachmentType,
  DefaultChannelType,
  DefaultCommandType,
  DefaultEventType,
  DefaultMessageType,
  DefaultReactionType,
  DefaultUserType,
} from '../../types/types';

export type MessageInputProps<
  At extends DefaultAttachmentType = DefaultAttachmentType,
  Ch extends DefaultChannelType = DefaultChannelType,
  Co extends DefaultCommandType = DefaultCommandType,
  Ev extends DefaultEventType = DefaultEventType,
  Me extends DefaultMessageType = DefaultMessageType,
  Re extends DefaultReactionType = DefaultReactionType,
  Us extends DefaultUserType<Us> = DefaultUserType,
  V extends CustomTrigger = CustomTrigger
> = {
  /**
   * Any additional attributes that you may want to add for underlying HTML textarea element.
   * ```
   * <MessageInput
   *  additionalTextareaProps={{
   *    maxLength: 10,
   *  }}
   * />
   * ```
   */
  additionalTextareaProps?: React.TextareaHTMLAttributes<HTMLTextAreaElement>;
  /** Callback to clear editing state in parent component */
  clearEditingState?: () => void;
  /** Disable input */
  disabled?: boolean;
  /** If true, the suggestion list will not display and autocomplete mentions. Default: false. */
  disableMentions?: boolean;
  /** Override file upload request */
  doFileUploadRequest?: (
    file: FileUpload['file'],
    channel: Channel<At, Ch, Co, Ev, Me, Re, Us>,
  ) => Promise<SendFileAPIResponse>;
  /** Override image upload request */
  doImageUploadRequest?: (
    file: ImageUpload['file'],
    channel: Channel<At, Ch, Co, Ev, Me, Re, Us>,
  ) => Promise<SendFileAPIResponse>;
  /** Custom error handler, called when file/image uploads fail */
  errorHandler?: (
    error: Error,
    type: string,
    file: (FileUpload | ImageUpload)['file'] & { id?: string },
  ) => void;
  /** Set focus to the text input if this is enabled */
  focus?: boolean;
  /** Grow the textarea while you're typing */
  grow?: boolean;
  /** The component handling how the input is rendered */
  Input?: React.ComponentType<MessageInputProps<At, Ch, Co, Ev, Me, Re, Us, V>>;
  /** Currently, Enter is the default submission key and Shift+Enter is the default for new line.
   * If provided, this array of keycode numbers will override the default Enter for submission, and Enter will then only create a new line.
   * Shift + Enter will still always create a new line, unless Shift+Enter [16, 13] are included in the override.
   * e.g.: [[16,13], [57], [48]] - submission keys would then be Shift+Enter, 9, and 0.
   * */
  keycodeSubmitKeys?: Array<number[]>;
  /** Max number of rows the textarea is allowed to grow */
  maxRows?: number;
  /** If true, the suggestion list will search all app users, not just current channel members/watchers. Default: false. */
  mentionAllAppUsers?: boolean;
  /** Object containing filters/sort/options overrides for mentions user query */
  mentionQueryParams?: SearchQueryParams<Us>;
  /** Message object. If defined, the message passed will be edited, instead of a new message being created */
  message?: StreamMessage<At, Ch, Co, Ev, Me, Re, Us>;
  /** If true, file uploads are disabled. Default: false */
  noFiles?: boolean;
  /** Completely override the submit handler (advanced usage only) */
  overrideSubmitHandler?: (
    message: {
      attachments: Attachment<At>[];
      mentioned_users: UserResponse<Us>[];
      text: string;
      parent?: StreamMessage<At, Ch, Co, Ev, Me, Re, Us>;
    },
    channelCid: string,
  ) => void;
  /** The parent message object when replying on a thread */
  parent?: StreamMessage<At, Ch, Co, Ev, Me, Re, Us>;
  /** Enable/disable firing the typing event */
  publishTypingEvent?: boolean;
};

const UnMemoizedMessageInput = <
  At extends DefaultAttachmentType = DefaultAttachmentType,
  Ch extends DefaultChannelType = DefaultChannelType,
  Co extends DefaultCommandType = DefaultCommandType,
  Ev extends DefaultEventType = DefaultEventType,
  Me extends DefaultMessageType = DefaultMessageType,
  Re extends DefaultReactionType = DefaultReactionType,
  Us extends DefaultUserType<Us> = DefaultUserType,
  V extends CustomTrigger = CustomTrigger
>(
  props: MessageInputProps<At, Ch, Co, Ev, Me, Re, Us, V>,
) => {
  const { Input: PropInput } = props;

  const { Input: ContextInput, TriggerProvider = DefaultTriggerProvider } = useComponentContext<
    At,
    Ch,
    Co,
    Ev,
    Me,
    Re,
    Us,
    V
  >();

  const Input = PropInput || ContextInput || MessageInputFlat;

  const messageInputState = useMessageInputState<At, Ch, Co, Ev, Me, Re, Us, V>({
    ...props,
    additionalTextareaProps: props.additionalTextareaProps || {},
    disabled: props.disabled || false,
    focus: props.focus || false,
    grow: props.grow || true,
    maxRows: props.maxRows || 10,
    publishTypingEvent: props.publishTypingEvent || true,
  });

  const cooldownTimerState = useCooldownTimer<At, Ch, Co, Ev, Me, Re, Us>();

  const messageInputContextValue = {
    ...cooldownTimerState,
    ...messageInputState,
    ...props,
  };

  return (
    <MessageInputContextProvider<At, Ch, Co, Ev, Me, Re, Us, V> value={messageInputContextValue}>
      <TriggerProvider<At, Ch, Co, Ev, Me, Re, Us, V>>
        <Input />
      </TriggerProvider>
    </MessageInputContextProvider>
  );
};

/**
 * MessageInput - a high level component that has provides all functionality to the Input it renders.
 *
 * It exposes the [useMessageInput](https://getstream.github.io/stream-chat-react/#section-usemessageinput) hook, which accepts the MessageInput props and returns
 * all functions needed to customize and build your custom Input components.
 * @example ./MessageInput.md
 */
export const MessageInput = React.memo(UnMemoizedMessageInput) as typeof UnMemoizedMessageInput;
