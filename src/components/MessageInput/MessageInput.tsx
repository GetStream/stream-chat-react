import React from 'react';

import { MessageInputLarge } from './MessageInputLarge';

import type { Attachment, Channel, SendFileAPIResponse } from 'stream-chat';

import type { FileUpload, ImageUpload } from './hooks/messageInput';
import type { SendButtonProps } from './icons';

import type {
  SuggestionListProps,
  TriggerSettings,
} from '../ChatAutoComplete/ChatAutoComplete';

import type { StreamMessage } from '../../context/ChannelContext';

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
   * e.g.
   * <MessageInput
   *  additionalTextareaProps={{
   *    maxLength: 10,
   *  }}
   * />
   */
  additionalTextareaProps?: React.TextareaHTMLAttributes<HTMLTextAreaElement>;
  /**
   * Override the default triggers of the ChatAutoComplete component
   */
  autocompleteTriggers?: TriggerSettings<Co, Us, V>;
  /** Callback to clear editing state in parent component */
  clearEditingState?: () => void;
  /** Disable input */
  disabled?: boolean;
  /** enable/disable firing the typing event */
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
   *
   * Defaults to and accepts same props as: [EmojiIconSmall](https://github.com/GetStream/stream-chat-react/blob/master/src/components/MessageInput/icons.js)
   */
  EmojiIcon?: React.ComponentType;
  /** Custom error handler, called when file/image uploads fail. */
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
  /** Message object. If defined, the message passed will be edited, instead of a new message being created */
  message?: StreamMessage<At, Ch, Co, Ev, Me, Re, Us>;
  /** If true, file uploads are disabled. Default: false */
  noFiles?: boolean;
  /** Completely override the submit handler (advanced usage only) */
  overrideSubmitHandler?: (
    message: {
      attachments: Attachment<At>[];
      mentioned_users: string[];
      text: string;
      parent?: StreamMessage<At, Ch, Co, Ev, Me, Re, Us>;
    },
    channelCid: string,
  ) => void;
  /** The parent message object when replying on a thread */
  parent?: StreamMessage<At, Ch, Co, Ev, Me, Re, Us>;
  /** enable/disable firing the typing event */
  publishTypingEvent?: boolean;
  /**
   * Custom UI component for send button.
   *
   * Defaults to and accepts same props as: [SendButton](https://getstream.github.io/stream-chat-react/#sendbutton)
   */
  SendButton?: React.ComponentType<SendButtonProps>;
  /** Override default suggestion list component */
  SuggestionList?: React.ComponentType<SuggestionListProps<Co, Us, V>>;
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
    additionalTextareaProps = {},
    disabled = false,
    focus = false,
    grow = true,
    Input = MessageInputLarge,
    maxRows = 10,
    publishTypingEvent = true,
  } = props;
  return (
    <Input
      {...props}
      {...{
        additionalTextareaProps,
        disabled,
        focus,
        grow,
        maxRows,
        publishTypingEvent,
      }}
    />
  );
};

export const MessageInput = React.memo(
  UnMemoizedMessageInput,
) as typeof UnMemoizedMessageInput;
