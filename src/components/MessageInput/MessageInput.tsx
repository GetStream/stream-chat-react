import React from 'react';

import { DefaultTriggerProvider } from './DefaultTriggerProvider';
import { MessageInputLarge } from './MessageInputLarge';

import { CooldownTimerProps, useCooldownTimer } from './hooks/useCooldownTimer';
import { useMessageInputState } from './hooks/useMessageInputState';
import { MessageInputContextProvider } from '../../context/MessageInputContext';
import { ComponentProvider, useComponentContext } from '../../context/ComponentContext';

import type { Attachment, Channel, SendFileAPIResponse, UserResponse } from 'stream-chat';

import type { FileUpload, ImageUpload } from './hooks/useMessageInputState';
import type { SendButtonProps } from './icons';

import type { SearchQueryParams } from '../ChannelSearch/ChannelSearch';
import type {
  SuggestionItemProps,
  SuggestionListProps,
  TriggerSettings,
} from '../ChatAutoComplete/ChatAutoComplete';

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
} from '../../../types/types';

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
  /**
   * Override the default triggers of the [ChatAutoComplete](https://github.com/GetStream/stream-chat-react/blob/master/src/components/ChatAutoComplete/Avatar.tsx) component
   */
  autocompleteTriggers?: TriggerSettings<Co, Us, V>;
  /** Callback to clear editing state in parent component */
  clearEditingState?: () => void;
  /** Custom UI component to display the slow mode cooldown timer, defaults to and accepts same props as: [CooldownTimer](https://github.com/GetStream/stream-chat-react/blob/master/src/components/MessageInput/hooks/useCooldownTimer.tsx) */
  CooldownTimer?: React.ComponentType<CooldownTimerProps>;
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
  /**
   * Custom UI component for emoji button in input.
   * Defaults to and accepts same props as: [EmojiIconSmall](https://github.com/GetStream/stream-chat-react/blob/master/src/components/MessageInput/icons.tsx)
   */
  EmojiIcon?: React.ComponentType;
  /** Custom error handler, called when file/image uploads fail */
  errorHandler?: (
    error: Error,
    type: string,
    file: (FileUpload | ImageUpload)['file'] & { id?: string },
  ) => void;
  /** Change the FileUploadIcon component */
  FileUploadIcon?: React.ComponentType;
  /** Set focus to the text input if this is enabled */
  focus?: boolean;
  /** Grow the textarea while you're typing */
  grow?: boolean;
  /** The component handling how the input is rendered */
  Input?: React.ComponentType<MessageInputProps<At, Ch, Co, Ev, Me, Re, Us, V>>;
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
  /**
   * Custom UI component for send button.
   * Defaults to and accepts same props as: [SendButton](https://github.com/GetStream/stream-chat-react/blob/master/src/components/MessageInput/icons.tsx)
   */
  SendButton?: React.ComponentType<SendButtonProps>;
  /**
   * Optional UI component prop to override the default suggestion Item component.
   * Defaults to and accepts same props as: [Item](https://github.com/GetStream/stream-chat-react/blob/master/src/components/AutoCompleteTextarea/Item.js)
   */
  SuggestionItem?: React.ForwardRefExoticComponent<SuggestionItemProps<Co, Us>>;
  /**
   * Optional UI component prop to override the default List component that displays suggestions.
   * Defaults to and accepts same props as: [List](https://github.com/GetStream/stream-chat-react/blob/master/src/components/AutoCompleteTextarea/List.js)
   */
  SuggestionList?: React.ComponentType<SuggestionListProps<Co, Us, V>>;
  /**
   * Optional component that lets you override the default autocomplete triggers.
   * Defaults to: [DefaultTriggerProvider](https://github.com/GetStream/stream-chat-react/blob/master/src/components/MessageInput/DefaultTriggerProvider.tsx)
   */
  TriggerProvider?: React.ComponentType<Record<string, unknown>>;
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
  const {
    CooldownTimer,
    EmojiIcon,
    FileUploadIcon,
    Input: PropInput,
    SendButton,
    SuggestionItem,
    SuggestionList,
    TriggerProvider: PropTriggerProvider,
  } = props;

  const {
    MessageInput: ContextInput,
    TriggerProvider: ContextTriggerProvider,
    ...currentComponentContext
  } = useComponentContext<At, Ch, Co, Ev, Me, Re, Us, V>();

  const Input = PropInput || ContextInput || MessageInputLarge;
  const TriggerProvider = PropTriggerProvider || ContextTriggerProvider || DefaultTriggerProvider;

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

  const componentContextValue = {
    ...currentComponentContext,
    AutocompleteSuggestionItem: SuggestionItem,
    AutocompleteSuggestionList: SuggestionList,
    CooldownTimer,
    EmojiIcon,
    FileUploadIcon,
    MessageInput: Input,
    SendButton,
  };

  return (
    <ComponentProvider<At, Ch, Co, Ev, Me, Re, Us, V> value={componentContextValue}>
      <MessageInputContextProvider<At, Ch, Co, Ev, Me, Re, Us, V> value={messageInputContextValue}>
        <TriggerProvider>
          <Input />
        </TriggerProvider>
      </MessageInputContextProvider>
    </ComponentProvider>
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
