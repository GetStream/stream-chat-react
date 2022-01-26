import { useCallback, useEffect, useRef, useState } from 'react';

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
  textareaRef: React.MutableRefObject<HTMLTextAreaElement | undefined>,
  closeEmojiPickerOnClick?: boolean,
) => {
  const [focusedEmoji, setFocusedEmoji] = useState<number>(0);

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
    const emojiMart = document.querySelector('.emoji-mart');
    const tabbableElements = emojiMart?.querySelectorAll('button');

    if (tabbableElements?.length) {
      if (event.key === 'ArrowRight') {
        setFocusedEmoji((prevFocused) => {
          if (prevFocused === undefined) return 0;
          return prevFocused === tabbableElements.length - 1 ? 0 : prevFocused + 1;
        });
      }

      if (event.key === 'ArrowLeft') {
        setFocusedEmoji((prevFocused) => {
          if (prevFocused === undefined) return 0;
          return prevFocused === 0 ? tabbableElements.length - 1 : prevFocused - 1;
        });
      }
    }

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

  useEffect(() => {
    if (state.emojiPickerIsOpen) {
      const emojiMart = document.querySelector('.emoji-mart');
      const tabbableElements = emojiMart?.querySelectorAll('button');
      if (tabbableElements) {
        (tabbableElements[focusedEmoji] as HTMLElement)?.focus();
      }
    }
  }, [focusedEmoji]);

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
