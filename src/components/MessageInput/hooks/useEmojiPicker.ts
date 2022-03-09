import { useCallback, useEffect, useRef } from 'react';

import type { MessageInputReducerAction, MessageInputState } from './useMessageInputState';
import type { BaseEmoji, EmojiData } from 'emoji-mart';

import type { DefaultStreamChatGenerics } from '../../../types/types';

export const useEmojiPicker = <
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics
>(
  state: MessageInputState<StreamChatGenerics>,
  dispatch: React.Dispatch<MessageInputReducerAction<StreamChatGenerics>>,
  insertText: (textToInsert: string) => void,
  textareaRef: React.MutableRefObject<HTMLTextAreaElement | undefined>,
  closeEmojiPickerOnClick?: boolean,
) => {
  const emojiPickerRef = useRef<HTMLDivElement>(null);

  const closeEmojiPicker = useCallback(
    (event: MouseEvent) => {
      event.preventDefault();

      if (emojiPickerRef.current && !emojiPickerRef.current.contains(event.target as Node)) {
        dispatch({
          type: 'setEmojiPickerIsOpen',
          value: false,
        });
      }
    },
    [emojiPickerRef],
  );

  const openEmojiPicker: React.MouseEventHandler<HTMLButtonElement> = useCallback((event) => {
    event.preventDefault();

    dispatch({
      type: 'setEmojiPickerIsOpen',
      value: true,
    });

    // Prevent event from bubbling to document, so the close handler is never called for this event
    event.stopPropagation();
  }, []);

  const handleEmojiKeyDown: React.KeyboardEventHandler<HTMLButtonElement> = (event) => {
    if (event.key === ' ' || event.key === 'Enter' || event.key === 'Spacebar') {
      event.preventDefault();
      /**
       * TODO: fix the below at some point because this type casting is wrong
       * and just forced to not have warnings currently with the unknown casting
       */
      openEmojiPicker((event as unknown) as React.MouseEvent<HTMLButtonElement, MouseEvent>);
    }
  };

  const handleEmojiEscape = (event: KeyboardEvent) => {
    if (event.key === 'Escape') {
      dispatch({
        type: 'setEmojiPickerIsOpen',
        value: false,
      });
    }
  };

  useEffect(() => {
    if (state.emojiPickerIsOpen) {
      document.addEventListener('click', closeEmojiPicker, false);
      document.addEventListener('keydown', handleEmojiEscape);
    }
    return () => {
      document.removeEventListener('click', closeEmojiPicker, false);
      document.removeEventListener('keydown', handleEmojiEscape);
    };
  }, [closeEmojiPicker, state.emojiPickerIsOpen]);

  const onSelectEmoji = useCallback(
    (emoji: EmojiData) => {
      insertText((emoji as BaseEmoji).native);
      if (closeEmojiPickerOnClick) {
        dispatch({
          type: 'setEmojiPickerIsOpen',
          value: false,
        });
      }

      textareaRef?.current?.focus();
    },
    [insertText],
  );

  return {
    closeEmojiPicker,
    emojiPickerRef,
    handleEmojiKeyDown,
    onSelectEmoji,
    openEmojiPicker,
  };
};
