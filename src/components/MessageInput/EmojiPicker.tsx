import React, { useEffect, useState } from 'react';
import { usePopper } from 'react-popper';

// TODO: replace with emoji-mart
import Picker from 'emoji-picker-react';

import {
  ThemeVersion,
  useChatContext,
  useMessageInputContext,
  useTranslationContext,
} from '../../context';
import { EmojiIconLarge, EmojiPickerIcon } from './icons';
import { Tooltip } from '../Tooltip';

const classNames: Record<
  ThemeVersion,
  Record<
    'buttonClassName' | 'emojiPickerContainerClassName' | 'wrapperClassName',
    string | undefined
  >
> = {
  1: {
    buttonClassName: 'str-chat__input-flat-emojiselect',
    emojiPickerContainerClassName: undefined,
    wrapperClassName: 'str-chat__emojiselect-wrapper',
  },
  2: {
    buttonClassName: 'str-chat__emoji-picker-button',
    emojiPickerContainerClassName: 'str-chat__message-textarea-emoji-picker-container',
    wrapperClassName: 'str-chat__message-textarea-emoji-picker',
  },
};

// TODO: handle small variant (MessageInputSmall)
export const EmojiPicker = () => {
  const { themeVersion } = useChatContext('EmojiPicker');
  const { t } = useTranslationContext('EmojiPicker');
  const { insertText, textareaRef } = useMessageInputContext('EmojiPicker');
  const [displayPicker, setDisplayPicker] = useState(false);
  const [referenceElement, setReferenceElement] = useState<HTMLButtonElement | null>(null);
  const [popperElement, setPopperElement] = useState<HTMLDivElement | null>(null);
  const { attributes, styles } = usePopper(referenceElement, popperElement, {
    placement: themeVersion === '2' ? 'top-end' : 'top-start',
  });

  const { buttonClassName, emojiPickerContainerClassName, wrapperClassName } = classNames[
    themeVersion
  ];

  useEffect(() => {
    if (!popperElement || !referenceElement) return;

    const handlePointerDown = (e: PointerEvent) => {
      const target = e.target as HTMLElement;

      if (popperElement.contains(target) || referenceElement.contains(target)) return;

      setDisplayPicker(false);
    };

    window.addEventListener('pointerdown', handlePointerDown);
    return () => window.removeEventListener('pointerdown', handlePointerDown);
  }, [referenceElement, popperElement]);

  return (
    <div className={wrapperClassName}>
      {displayPicker && (
        <div
          className={emojiPickerContainerClassName}
          style={styles.popper}
          {...attributes.popper}
          ref={setPopperElement}
        >
          <Picker
            lazyLoadEmojis
            onEmojiClick={(e) => {
              insertText(e.emoji);
              textareaRef.current?.focus();
            }}
          />
        </div>
      )}
      {themeVersion === '1' && (
        <Tooltip>
          {displayPicker ? t<string>('Close emoji picker') : t<string>('Open emoji picker')}
        </Tooltip>
      )}
      <button
        aria-label='Emoji picker'
        className={buttonClassName}
        onClick={() => setDisplayPicker((cv) => !cv)}
        ref={setReferenceElement}
        type='button'
      >
        {themeVersion === '2' ? <EmojiPickerIcon /> : <EmojiIconLarge />}
      </button>
    </div>
  );
};
