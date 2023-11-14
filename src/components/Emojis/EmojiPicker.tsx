/* eslint-disable typescript-sort-keys/interface */
import React, { useEffect, useState } from 'react';
import { usePopper } from 'react-popper';
import Picker from '@emoji-mart/react';

import type { Options } from '@popperjs/core';

import {
  ThemeVersion,
  useChatContext,
  useMessageInputContext,
  useTranslationContext,
} from '../../context';
import { EmojiIconLarge, EmojiPickerIcon } from '../MessageInput/icons';
import { Tooltip } from '../Tooltip';

export type EmojiPickerProps = {
  ButtonIconComponent?: React.ComponentType;
  buttonClassName?: string;
  pickerContainerClassName?: string;
  wrapperClassName?: string;
  /**
   * Untyped [properties](https://github.com/missive/emoji-mart/tree/v5.5.2#options--props) to be
   * passed to the [emoji-mart `Picker`](https://github.com/missive/emoji-mart/tree/v5.5.2#-picker) component
   */
  pickerProps?: { theme: 'auto' | 'light' | 'dark' } & Record<string, unknown>;
  /**
   * [React Popper options](https://popper.js.org/docs/v2/constructors/#options) to be
   * passed to the [react-popper `usePopper`](https://popper.js.org/react-popper/v2/hook/) hook
   */
  popperOptions?: Options;
};

const classNames: Record<ThemeVersion, EmojiPickerProps> = {
  1: {
    buttonClassName: 'str-chat__input-flat-emojiselect',
    pickerContainerClassName: undefined,
    wrapperClassName: 'str-chat__emojiselect-wrapper',
  },
  2: {
    buttonClassName: 'str-chat__emoji-picker-button',
    pickerContainerClassName: 'str-chat__message-textarea-emoji-picker-container',
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
    ...props.popperOptions,
  });

  const { buttonClassName, pickerContainerClassName, wrapperClassName } = classNames[themeVersion];

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
          className={props.pickerContainerClassName ?? pickerContainerClassName}
          style={styles.popper}
          {...attributes.popper}
          ref={setPopperElement}
        >
          <Picker
            data={async () => (await import('@emoji-mart/data')).default}
            onEmojiSelect={(e: { native: string }) => {
              insertText(e.native);
              textareaRef.current?.focus();
            }}
            {...props.pickerProps}
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
