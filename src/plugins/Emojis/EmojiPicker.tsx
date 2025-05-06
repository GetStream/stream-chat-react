import React, { useEffect, useState } from 'react';
import { usePopper } from 'react-popper';
import Picker from '@emoji-mart/react';

import type { Options } from '@popperjs/core';

import { EmojiPickerIcon } from './icons';
import { useMessageInputContext, useTranslationContext } from '../../context';
import { useMessageComposer } from '../../components';

const isShadowRoot = (node: Node): node is ShadowRoot => !!(node as ShadowRoot).host;

export type EmojiPickerProps = {
  ButtonIconComponent?: React.ComponentType;
  buttonClassName?: string;
  pickerContainerClassName?: string;
  wrapperClassName?: string;
  closeOnEmojiSelect?: boolean;
  /**
   * Untyped [properties](https://github.com/missive/emoji-mart/tree/v5.5.2#options--props) to be
   * passed down to the [emoji-mart `Picker`](https://github.com/missive/emoji-mart/tree/v5.5.2#-picker) component
   */
  pickerProps?: Partial<{ theme: 'auto' | 'light' | 'dark' } & Record<string, unknown>>;
  /**
   * [React Popper options](https://popper.js.org/docs/v2/constructors/#options) to be
   * passed down to the [react-popper `usePopper`](https://popper.js.org/react-popper/v2/hook/) hook
   */
  popperOptions?: Partial<Options>;
};

const classNames: EmojiPickerProps = {
  buttonClassName: 'str-chat__emoji-picker-button',
  pickerContainerClassName: 'str-chat__message-textarea-emoji-picker-container',
  wrapperClassName: 'str-chat__message-textarea-emoji-picker',
};

export const EmojiPicker = (props: EmojiPickerProps) => {
  const { t } = useTranslationContext('EmojiPicker');
  const { textareaRef } = useMessageInputContext('EmojiPicker');
  const { textComposer } = useMessageComposer();
  const [displayPicker, setDisplayPicker] = useState(false);
  const [referenceElement, setReferenceElement] = useState<HTMLButtonElement | null>(
    null,
  );
  const [popperElement, setPopperElement] = useState<HTMLDivElement | null>(null);
  const { attributes, styles } = usePopper(referenceElement, popperElement, {
    placement: 'top-end',
    ...props.popperOptions,
  });

  const { buttonClassName, pickerContainerClassName, wrapperClassName } = classNames;

  const { ButtonIconComponent = EmojiPickerIcon } = props;

  useEffect(() => {
    if (!popperElement || !referenceElement) return;

    const handlePointerDown = (e: PointerEvent) => {
      const target = e.target as HTMLElement;

      const rootNode = target.getRootNode();

      if (
        popperElement.contains(isShadowRoot(rootNode) ? rootNode.host : target) ||
        referenceElement.contains(target)
      ) {
        return;
      }

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
              const textarea = textareaRef.current;
              if (!textarea) return;
              textComposer.insertText({ text: e.native });
              textarea.focus();
              if (props.closeOnEmojiSelect) {
                setDisplayPicker(false);
              }
            }}
            {...props.pickerProps}
          />
        </div>
      )}
      <button
        aria-expanded={displayPicker}
        aria-label={t('aria/Emoji picker')}
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
