import { useCallback, useEffect, useRef } from 'react';
import { type TextComposerState } from 'stream-chat';
import type {
  MessageInputReducerAction,
  MessageInputState,
} from './useMessageInputState';
import type { MessageInputProps } from '../MessageInput';
import { useChannelStateContext } from '../../../context/ChannelStateContext';

import type { CustomTrigger } from '../../../types/types';
import type { EnrichURLsController } from './useLinkPreviews';
import { useMessageComposer } from './messageComposer/useMessageComposer';
import { useStateStore } from '../../../store';

const messageComposerStateSelector = (state: TextComposerState) => ({
  text: state.text,
});

export const useMessageInputText = <V extends CustomTrigger = CustomTrigger>(
  props: MessageInputProps<V>,
  state: MessageInputState,
  dispatch: React.Dispatch<MessageInputReducerAction>,
  findAndEnqueueURLsToEnrich?: EnrichURLsController['findAndEnqueueURLsToEnrich'],
) => {
  const { channel } = useChannelStateContext('useMessageInputText');
  const { additionalTextareaProps, focus, parent, publishTypingEvent = true } = props;
  const messageComposer = useMessageComposer();
  const textareaRef = useRef<HTMLTextAreaElement>(undefined);
  const { text } = useStateStore(
    messageComposer.textComposer.state,
    messageComposerStateSelector,
  );
  // Focus
  useEffect(() => {
    if (focus && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [focus]);

  // Text + cursor position
  const newCursorPosition = useRef<number>(undefined);

  const insertText = useCallback(
    (textToInsert: string) => {
      const selection = textareaRef?.current && {
        start: textareaRef.current.selectionStart,
        end: textareaRef.current.selectionEnd,
      };
      messageComposer.textComposer.insertText({
        text: textToInsert,
        selection,
      });
      if (selection) newCursorPosition.current = selection.start + textToInsert.length;
    },
    [messageComposer, newCursorPosition, textareaRef],
  );

  useEffect(() => {
    const textareaElement = textareaRef.current;
    if (textareaElement && newCursorPosition.current !== undefined) {
      textareaElement.selectionStart = newCursorPosition.current;
      textareaElement.selectionEnd = newCursorPosition.current;
      newCursorPosition.current = undefined;
    }
  }, [text, newCursorPosition]);

  const handleChange: React.ChangeEventHandler<HTMLTextAreaElement> = useCallback(
    (event) => {
      event.preventDefault();
      if (!event.target || !textareaRef.current) return;
    },
    [messageComposer],
  );

  return {
    handleChange,
    insertText,
    textareaRef,
  };
};
