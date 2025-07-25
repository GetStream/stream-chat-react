import type { PropsWithChildren } from 'react';
import React, { useEffect } from 'react';

import { MessageInputFlat } from './MessageInputFlat';
import { useMessageComposer } from './hooks';
import { useCooldownTimer } from './hooks/useCooldownTimer';
import { useCreateMessageInputContext } from './hooks/useCreateMessageInputContext';
import { useMessageInputControls } from './hooks/useMessageInputControls';
import type { ComponentContextValue } from '../../context/ComponentContext';
import { useComponentContext } from '../../context/ComponentContext';
import { MessageInputContextProvider } from '../../context/MessageInputContext';
import { DialogManagerProvider } from '../../context';
import { useStableId } from '../UtilityComponents/useStableId';

import type { LocalMessage, Message, SendMessageOptions } from 'stream-chat';

import type { CustomAudioRecordingConfig } from '../MediaRecorder';
import { useRegisterDropHandlers } from './WithDragAndDropUpload';

export type EmojiSearchIndexResult = {
  id: string;
  name: string;
  skins: Array<{ native: string }>;
  emoticons?: Array<string>;
  native?: string;
};

export interface EmojiSearchIndex {
  search: (
    query: string,
  ) => PromiseLike<Array<EmojiSearchIndexResult>> | Array<EmojiSearchIndexResult> | null;
}

export type MessageInputProps = {
  /**
   * Additional props to be passed to the underlying `AutoCompleteTextarea` component.
   * Default value is handled via MessageComposer.
   * [Available props](https://www.npmjs.com/package/react-textarea-autosize)
   */
  additionalTextareaProps?: Omit<
    React.TextareaHTMLAttributes<HTMLTextAreaElement>,
    'defaultValue' | 'style' | 'disabled' | 'value'
  >;
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
  /** Mechanism to be used with autocomplete and text replace features of the `MessageInput` component, see [emoji-mart `SearchIndex`](https://github.com/missive/emoji-mart#%EF%B8%8F%EF%B8%8F-headless-search) */
  emojiSearchIndex?: ComponentContextValue['emojiSearchIndex'];
  /** If true, focuses the text input on component mount */
  focus?: boolean;
  /** Allows to hide MessageInput's send button. */
  hideSendButton?: boolean;
  /** Custom UI component handling how the message input is rendered, defaults to and accepts the same props as [MessageInputFlat](https://github.com/GetStream/stream-chat-react/blob/master/src/components/MessageInput/MessageInputFlat.tsx) */
  Input?: React.ComponentType<MessageInputProps>;
  /** @deprecated use messageComposer.threadId to indicate, whether the message is composed within a thread context
   * Signals that the MessageInput is rendered in a message thread (Thread component)
   */
  isThreadInput?: boolean;
  /** Max number of rows the underlying `textarea` component is allowed to grow */
  maxRows?: number;
  /** Min number of rows the underlying `textarea` will start with. The `grow` on MessageInput prop has to be enabled for `minRows` to take effect. */
  minRows?: number;
  /** Function to override the default message sending process. Not message updating process. */
  overrideSubmitHandler?: (params: {
    cid: string;
    localMessage: LocalMessage;
    message: Message;
    sendOptions: SendMessageOptions;
  }) => Promise<void> | void;
  /** When replying in a thread, the parent message object */
  parent?: LocalMessage;
  /** If true, will use an optional dependency to support transliteration in the input for mentions, default is false. See: https://github.com/getstream/transliterate */
  /**
   * Currently, `Enter` is the default submission key and  `Shift`+`Enter` is the default combination for the new line.
   * If specified, this function overrides the default behavior specified previously.
   *
   * Example of default behavior:
   * ```tsx
   * const defaultShouldSubmit = (event) => event.key === "Enter" && !event.shiftKey;
   * ```
   */
  shouldSubmit?: (event: React.KeyboardEvent<HTMLTextAreaElement>) => boolean;
};

const MessageInputProvider = (props: PropsWithChildren<MessageInputProps>) => {
  const cooldownTimerState = useCooldownTimer();
  const messageInputUiApi = useMessageInputControls(props);
  const { emojiSearchIndex } = useComponentContext('MessageInput');

  const messageInputContextValue = useCreateMessageInputContext({
    ...cooldownTimerState,
    ...messageInputUiApi,
    ...props,
    emojiSearchIndex: props.emojiSearchIndex ?? emojiSearchIndex,
  });

  const messageComposer = useMessageComposer();

  useEffect(
    () => () => {
      messageComposer.createDraft();
    },
    [messageComposer],
  );

  useEffect(() => {
    const threadId = messageComposer.threadId;
    if (
      !threadId ||
      !messageComposer.channel ||
      !messageComposer.compositionIsEmpty ||
      !messageComposer.config.drafts.enabled
    )
      return;
    // get draft data for legacy thead composer
    messageComposer.channel
      .getDraft({ parent_id: threadId })
      .then(({ draft }) => {
        if (draft) {
          messageComposer.initState({ composition: draft });
        }
      })
      .catch(console.error);
  }, [messageComposer]);

  useRegisterDropHandlers();

  return (
    <MessageInputContextProvider value={messageInputContextValue}>
      {props.children}
    </MessageInputContextProvider>
  );
};

const UnMemoizedMessageInput = (props: MessageInputProps) => {
  const { Input: PropInput } = props;

  const { Input: ContextInput } = useComponentContext('MessageInput');
  const messageComposer = useMessageComposer();
  const id = useStableId();

  const Input = PropInput || ContextInput || MessageInputFlat;
  const dialogManagerId = messageComposer.threadId
    ? `message-input-dialog-manager-thread-${id}`
    : `message-input-dialog-manager-${id}`;

  return (
    <DialogManagerProvider id={dialogManagerId}>
      <MessageInputProvider {...props}>
        <Input />
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
