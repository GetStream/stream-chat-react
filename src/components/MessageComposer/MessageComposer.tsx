import type { PropsWithChildren } from 'react';
import React, { useEffect } from 'react';

import { MessageComposerUI as DefaultMessageComposerUI } from './MessageComposerUI';
import { useMessageComposerController } from './hooks';
import { useCreateMessageComposerContext } from './hooks/useCreateMessageComposerContext';
import { useMessageComposerBindings } from './hooks/useMessageComposerBindings';
import type { ComponentContextValue } from '../../context/ComponentContext';
import { useComponentContext } from '../../context/ComponentContext';
import { MessageComposerContextProvider } from '../../context/MessageComposerContext';
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

export type MessageComposerProps = {
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
  /** Mechanism to be used with autocomplete and text replace features of the `MessageComposer` component, see [emoji-mart `SearchIndex`](https://github.com/missive/emoji-mart#%EF%B8%8F%EF%B8%8F-headless-search) */
  emojiSearchIndex?: ComponentContextValue['emojiSearchIndex'];
  /** If true, focuses the text input on component mount */
  focus?: boolean;
  // todo: what sense does hideSendButton prop make, when we have message composer actions (recording, send msg). Can we remove it?
  // /** Allows to hide MessageComposer's send button. */
  hideSendButton?: boolean;
  /** Max number of rows the underlying `textarea` component is allowed to grow */
  maxRows?: number;
  /** Min number of rows the underlying `textarea` will start with. The `grow` on MessageComposer prop has to be enabled for `minRows` to take effect. */
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

const MessageComposerProvider = (props: PropsWithChildren<MessageComposerProps>) => {
  const messageComposerBindings = useMessageComposerBindings(props);
  const { emojiSearchIndex } = useComponentContext('MessageComposer');

  const messageComposerContextValue = useCreateMessageComposerContext({
    ...messageComposerBindings,
    ...props,
    emojiSearchIndex: props.emojiSearchIndex ?? emojiSearchIndex,
  });

  const messageComposer = useMessageComposerController();

  useEffect(
    () => () => {
      messageComposer.createDraft().finally(() => messageComposer.clear());
    },
    [messageComposer],
  );

  useEffect(() => {
    const threadId = messageComposer.threadId;
    if (
      !threadId ||
      !messageComposer.channel ||
      !messageComposer.contentIsEmpty ||
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
    <MessageComposerContextProvider value={messageComposerContextValue}>
      {props.children}
    </MessageComposerContextProvider>
  );
};

const UnMemoizedMessageComposer = (props: MessageComposerProps) => {
  const { MessageComposerUI = DefaultMessageComposerUI } =
    useComponentContext('MessageComposer');
  const messageComposer = useMessageComposerController();
  const id = useStableId();

  const dialogManagerId = messageComposer.threadId
    ? `message-input-dialog-manager-thread-${id}`
    : `message-input-dialog-manager-${id}`;

  return (
    <DialogManagerProvider id={dialogManagerId}>
      <MessageComposerProvider {...props}>
        <MessageComposerUI />
      </MessageComposerProvider>
    </DialogManagerProvider>
  );
};

/**
 * A high level component that has provides all functionality to the Input it renders.
 */
export const MessageComposer = React.memo(
  UnMemoizedMessageComposer,
) as typeof UnMemoizedMessageComposer;
