import { useCallback, useEffect, useRef } from 'react';

import type { MessageInputReducerAction, MessageInputState } from './useMessageInputState';
import type { BaseEmoji, EmojiData } from 'emoji-mart';

import type { DefaultAttachmentType, DefaultUserType } from '../../../types/types';

export const useEmojiPicker = <
  At extends DefaultAttachmentType = DefaultAttachmentType,
  Us extends DefaultUserType<Us> = DefaultUserType
>(
  state: MessageInputState<At, Us>,
  dispatch: React.Dispatch<MessageInputReducerAction<Us>>,
  insertText: (textToInsert: string) => void,
) => {
  const emojiPickerRef = useRef<HTMLDivElement>(null);

  const closeEmojiPicker = useCallback(
    (event: MouseEvent) => {
      if (emojiPickerRef.current && !emojiPickerRef.current.contains(event.target as Node)) {
        dispatch({
          type: 'setEmojiPickerIsOpen',
          value: false,
        });
      }
    },
    [emojiPickerRef],
  );

  const openEmojiPicker: React.MouseEventHandler<HTMLSpanElement> = useCallback((event) => {
    dispatch({
      type: 'setEmojiPickerIsOpen',
      value: true,
    });

    // Prevent event from bubbling to document, so the close handler is never called for this event
    event.stopPropagation();
  }, []);

  const handleEmojiKeyDown: React.KeyboardEventHandler<HTMLSpanElement> = (event) => {
    if (event.key === ' ' || event.key === 'Enter' || event.key === 'Spacebar') {
      event.preventDefault();
      /**
       * TODO: fix the below at some point because this type casting is wrong
       * and just forced to not have warnings currently with the unknown casting
       */
      openEmojiPicker((event as unknown) as React.MouseEvent<HTMLSpanElement, MouseEvent>);
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

  const onSelectEmoji = useCallback((emoji: EmojiData) => insertText((emoji as BaseEmoji).native), [
    insertText,
  ]);

  return {
    closeEmojiPicker,
    emojiPickerRef,
    handleEmojiKeyDown,
    onSelectEmoji,
    openEmojiPicker,
  };
};
