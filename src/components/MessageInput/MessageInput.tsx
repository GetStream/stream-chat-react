import React from 'react';

import { DefaultTriggerProvider } from './DefaultTriggerProvider';
import { MessageInputFlat } from './MessageInputFlat';

import { useCooldownTimer } from './hooks/useCooldownTimer';
import { useCreateMessageInputContext } from './hooks/useCreateMessageInputContext';
import { useMessageInputState } from './hooks/useMessageInputState';
import { MessageInputContextProvider } from '../../context/MessageInputContext';
import { useComponentContext } from '../../context/ComponentContext';

import type { Channel, SendFileAPIResponse } from 'stream-chat';

import type { FileUpload, ImageUpload } from './hooks/useMessageInputState';
import type { SearchQueryParams } from '../ChannelSearch/ChannelSearch';
import type { MessageToSend } from '../../context/ChannelActionContext';
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
  /** Additional props to be passed to the underlying `AutoCompleteTextarea` component, [available props](https://www.npmjs.com/package/react-textarea-autosize) */
  additionalTextareaProps?: React.TextareaHTMLAttributes<HTMLTextAreaElement>;
  /** Function to clear the editing state while editing a message */
  clearEditingState?: () => void;
  /** If true, disables the text input */
  disabled?: boolean;
  /** If true, the suggestion list will not display and autocomplete @mentions. Default: false. */
  disableMentions?: boolean;
  /** Function to override the default file upload request */
  doFileUploadRequest?: (
    file: FileUpload['file'],
    channel: Channel<At, Ch, Co, Ev, Me, Re, Us>,
  ) => Promise<SendFileAPIResponse>;
  /** Function to override the default image upload request */
  doImageUploadRequest?: (
    file: ImageUpload['file'],
    channel: Channel<At, Ch, Co, Ev, Me, Re, Us>,
  ) => Promise<SendFileAPIResponse>;
  /** Custom error handler function to be called with a file/image upload fails */
  errorHandler?: (
    error: Error,
    type: string,
    file: (FileUpload | ImageUpload)['file'] & { id?: string },
  ) => void;
  /** If true, focuses the text input on component mount */
  focus?: boolean;
  /** If true, expands the text input vertically for new lines */
  grow?: boolean;
  /** Custom UI component handling how the message input is rendered, defaults to and accepts the same props as [MessageInputFlat](https://github.com/GetStream/stream-chat-react/blob/master/src/components/MessageInput/MessageInputFlat.tsx) */
  Input?: React.ComponentType<MessageInputProps<At, Ch, Co, Ev, Me, Re, Us, V>>;
  /**
   * Currently, Enter is the default submission key and Shift+Enter is the default for new line.
   * If provided, this array of keycode numbers will override the default Enter for submission, and Enter will then only create a new line.
   * Shift + Enter will still always create a new line, unless Shift+Enter [16, 13] is included in the override.
   * e.g.: [[16,13], [57], [48]] - submission keys would then be Shift+Enter, 9, and 0.
   * */
  keycodeSubmitKeys?: Array<number[]>;
  /** Max number of rows the underlying `textarea` component is allowed to grow */
  maxRows?: number;
  /** If true, the suggestion list will search all app users for an @mention, not just current channel members/watchers. Default: false. */
  mentionAllAppUsers?: boolean;
  /** Object containing filters/sort/options overrides for an @mention user query */
  mentionQueryParams?: SearchQueryParams<Us>['userFilters'];
  /** If provided, the existing message will be edited on submit */
  message?: StreamMessage<At, Ch, Co, Ev, Me, Re, Us>;
  /** If true, disables file uploads for all attachments except for those with type 'image'. Default: false */
  noFiles?: boolean;
  /** Function to override the default submit handler */
  overrideSubmitHandler?: (
    message: MessageToSend<At, Ch, Co, Ev, Me, Re, Us>,
    channelCid: string,
  ) => void;
  /** When replying in a thread, the parent message object */
  parent?: StreamMessage<At, Ch, Co, Ev, Me, Re, Us>;
  /** If true, triggers typing events on text input keystroke */
  publishTypingEvent?: boolean;
  /** If true, will use an optional dependency to support transliteration in the input for mentions, default is false. See: https://github.com/sindresorhus/transliterate */
  useMentionsTransliteration?: boolean;
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
  >('MessageInput');

  const Input = PropInput || ContextInput || MessageInputFlat;

  const messageInputState = useMessageInputState<At, Ch, Co, Ev, Me, Re, Us, V>(props);

  const cooldownTimerState = useCooldownTimer<At, Ch, Co, Ev, Me, Re, Us>();

  const messageInputContextValue = useCreateMessageInputContext<At, Ch, Co, Ev, Me, Re, Us, V>({
    ...cooldownTimerState,
    ...messageInputState,
    ...props,
  });

  return (
    <MessageInputContextProvider<At, Ch, Co, Ev, Me, Re, Us, V> value={messageInputContextValue}>
      <TriggerProvider<At, Ch, Co, Ev, Me, Re, Us, V>>
        <Input />
      </TriggerProvider>
    </MessageInputContextProvider>
  );
};

/**
 * A high level component that has provides all functionality to the Input it renders.
 */
export const MessageInput = React.memo(UnMemoizedMessageInput) as typeof UnMemoizedMessageInput;
