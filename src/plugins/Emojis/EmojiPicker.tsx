import React, { useEffect, useState } from 'react';
import Picker from '@emoji-mart/react';

import { EmojiPickerIcon } from './icons';
import { useMessageInputContext, useTranslationContext } from '../../context';
import { Button, useCooldownRemaining, useMessageComposer } from '../../components';
import type { PopperLikePlacement } from '../../components';
import { usePopoverPosition } from '../../components/Dialog/hooks/usePopoverPosition';
import clsx from 'clsx';

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
   * Floating UI placement (default: 'top-end') for the picker popover
   */
  placement?: PopperLikePlacement;
  /**
   * Deprecated: Popper options, use `placement` instead.
   */
  popperOptions?: Partial<{ placement: PopperLikePlacement }>;
};

const classNames: EmojiPickerProps = {
  buttonClassName: clsx(
    'str-chat__emoji-picker-button',
    'str-chat__button--ghost',
    'str-chat__button--secondary',
    'str-chat__button--size-sm',
    'str-chat__button--circular',
  ),
  pickerContainerClassName: 'str-chat__message-textarea-emoji-picker-container',
  wrapperClassName: 'str-chat__message-textarea-emoji-picker',
};

export const EmojiPicker = (props: EmojiPickerProps) => {
  const { t } = useTranslationContext('EmojiPicker');
  const { textareaRef } = useMessageInputContext('EmojiPicker');
  const { textComposer } = useMessageComposer();
  const cooldownRemaining = useCooldownRemaining();
  const [displayPicker, setDisplayPicker] = useState(false);
  const [referenceElement, setReferenceElement] = useState<HTMLButtonElement | null>(
    null,
  );
  const [popperElement, setPopperElement] = useState<HTMLDivElement | null>(null);
  const { refs, strategy, x, y } = usePopoverPosition({
    placement: props.placement ?? 'top-end',
  });

  useEffect(() => {
    refs.setReference(referenceElement);
  }, [referenceElement, refs]);
  useEffect(() => {
    refs.setFloating(popperElement);
  }, [popperElement, refs]);

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
          ref={setPopperElement}
          style={{ left: x ?? 0, position: strategy, top: y ?? 0 }}
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
      <Button
        aria-expanded={displayPicker}
        aria-label={t('aria/Emoji picker')}
        className={props.buttonClassName ?? buttonClassName}
        disabled={!!cooldownRemaining}
        onClick={() => setDisplayPicker((cv) => !cv)}
        ref={setReferenceElement}
        type='button'
      >
        {ButtonIconComponent && <ButtonIconComponent />}
      </Button>
    </div>
  );
};
