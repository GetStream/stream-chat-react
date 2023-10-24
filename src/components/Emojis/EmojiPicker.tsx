/* eslint-disable typescript-sort-keys/interface */
import React, { useEffect, useState } from 'react';
import { usePopper } from 'react-popper';

import data from '@emoji-mart/data';
import Picker from '@emoji-mart/react';

import {
  ThemeVersion,
  useChatContext,
  useMessageInputContext,
  useTranslationContext,
} from '../../context';
import { EmojiIconLarge, EmojiPickerIcon } from '../MessageInput/icons';
import { Tooltip } from '../Tooltip';

type EmojiPickerProps = {
  ButtonIconComponent?: React.ComponentType;
  buttonClassName?: string;
  emojiPickerContainerClassName?: string;
  wrapperClassName?: string;
};

const classNames: Record<ThemeVersion, EmojiPickerProps> = {
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

export const EmojiPicker = (props: EmojiPickerProps) => {
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

  const { ButtonIconComponent = themeVersion === '2' ? EmojiPickerIcon : EmojiIconLarge } = props;

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
    <div className={props.wrapperClassName ?? wrapperClassName}>
      {displayPicker && (
        <div
          className={props.emojiPickerContainerClassName ?? emojiPickerContainerClassName}
          style={styles.popper}
          {...attributes.popper}
          ref={setPopperElement}
        >
          <Picker
            data={data}
            onEmojiSelect={(e: unknown) => {
              // @ts-ignore emoji-mart is missing types
              insertText(e.native);
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
        className={props.buttonClassName ?? buttonClassName}
        onClick={() => setDisplayPicker((cv) => !cv)}
        ref={setReferenceElement}
        type='button'
      >
        {ButtonIconComponent && <ButtonIconComponent />}
      </button>
    </div>
  );
};
