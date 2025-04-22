import { useCallback, useEffect, useRef } from 'react';
import { type TextComposerState } from 'stream-chat';
import type { MessageInputProps } from '../MessageInput';

import { useMessageComposer } from './messageComposer';
import { useStateStore } from '../../../store';

const messageComposerStateSelector = (state: TextComposerState) => ({
  text: state.text,
});

export const useMessageInputText = (props: MessageInputProps) => {
  const { focus } = props;
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
        end: textareaRef.current.selectionEnd,
        start: textareaRef.current.selectionStart,
      };
      messageComposer.textComposer.insertText({
        selection,
        text: textToInsert,
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

  return {
    insertText,
    textareaRef,
  };
};
