import type { PropsWithChildren } from 'react';
import React, { useEffect } from 'react';

import { MessageComposerUI as DefaultMessageComposerUI } from './MessageComposerUI';
import { useMessageComposerController } from './hooks';
import { useCreateMessageComposerContext } from './hooks/useCreateMessageComposerContext';
import { useMessageComposerBindings } from './hooks/useMessageComposerBindings';
import type { ComponentContextValue } from '../../context/ComponentContext';
import { useComponentContext } from '../../context/ComponentContext';
import { MessageComposerContextProvider } from '../../context/MessageComposerContext';
import {
  DialogManagerProvider,
  useMessageComposerControllerContext,
} from '../../context';
import { useStableId } from '../UtilityComponents/useStableId';

import type { LocalMessage } from 'stream-chat';

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
   * Additional props for the underlying textarea. `defaultValue`, `value`, `style` and `disabled`
   * are excluded because the composer controls them.
   * [Available props](https://www.npmjs.com/package/react-textarea-autosize)
   */
  additionalTextareaProps?: Omit<
    React.TextareaHTMLAttributes<HTMLTextAreaElement>,
    'defaultValue' | 'style' | 'disabled' | 'value'
  >;
  /**
   * When enabled, recorded messages are not sent immediately. They stack up with other attachments
   * in the composer, so the user can send several attachments in the same message.
   */
  asyncMessagesMultiSendEnabled?: boolean;
  /** Audio recording parameters for voice messages. */
  audioRecordingConfig?: CustomAudioRecordingConfig;
  /** Whether the UI to record voice messages is shown. */
  audioRecordingEnabled?: boolean;
  /**
   * Search mechanism for the autocomplete and text replace features.
   * See [emoji-mart `SearchIndex`](https://github.com/missive/emoji-mart#%EF%B8%8F%EF%B8%8F-headless-search).
   */
  emojiSearchIndex?: ComponentContextValue['emojiSearchIndex'];
  /** If true, focuses the text input on mount. */
  focus?: boolean;
  // todo: what sense does hideSendButton prop make, when we have message composer actions (recording, send msg). Can we remove it?
  // /** Allows to hide MessageComposer's send button. */
  hideSendButton?: boolean;
  /** Max number of rows the textarea can grow to. Defaults to 10. */
  maxRows?: number;
  /** Min number of rows of the textarea. While empty, it has a single row unless this is set. */
  minRows?: number;
  /** Parent message when composing a thread reply. */
  parent?: LocalMessage;
  /**
   * Decides whether a keydown submits the message. By default `Enter` submits unless an IME
   * composition is active, and `Shift`+`Enter` inserts a new line.
   *
   * ```tsx
   * const defaultShouldSubmit = (event) =>
   *   event.key === 'Enter' && !event.shiftKey && !event.nativeEvent.isComposing;
   * ```
   */
  shouldSubmit?: (event: React.KeyboardEvent<HTMLTextAreaElement>) => boolean;
};

const MessageComposerProvider = (props: PropsWithChildren<MessageComposerProps>) => {
  const messageComposerBindings = useMessageComposerBindings(props);
  const { emojiSearchIndex } = useComponentContext();

  const messageComposerContextValue = useCreateMessageComposerContext({
    ...messageComposerBindings,
    ...props,
    emojiSearchIndex: props.emojiSearchIndex ?? emojiSearchIndex,
  });

  const messageComposer = useMessageComposerController();
  const suppliedComposer = useMessageComposerControllerContext();

  useEffect(
    () => () => {
      // `createDraft` already skips edits and composers with drafts disabled.
      const draftSaved = messageComposer.createDraft().catch(console.error);
      // Only the thread's or channel's own composer is cleared here. One supplied through
      // `MessageComposerControllerProvider` belongs to its supplier, who decides when to clear
      // it: clearing on unmount would discard an edit the supplier still holds (visible in Strict
      // Mode).
      if (messageComposer === suppliedComposer) return;
      draftSaved.finally(() => messageComposer.clear());
    },
    [messageComposer, suppliedComposer],
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
    // Restores the thread draft into a composer that is still empty.
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
  const { MessageComposerUI = DefaultMessageComposerUI } = useComponentContext();
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
 * Provides the composer context and dialog manager to the `MessageComposerUI` it renders.
 */
export const MessageComposer = React.memo(
  UnMemoizedMessageComposer,
) as typeof UnMemoizedMessageComposer;
