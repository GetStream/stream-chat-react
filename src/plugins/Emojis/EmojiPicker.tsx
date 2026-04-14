import React, { useEffect, useState } from 'react';
import Picker from '@emoji-mart/react';

import { useMessageComposerContext, useTranslationContext } from '../../context';
import {
  Button,
  IconEmoji,
  type PopperLikePlacement,
  useMessageComposerController,
} from '../../components';
import { usePopoverPosition } from '../../components/Dialog/hooks/usePopoverPosition';
import { useIsCooldownActive } from '../../components/MessageComposer/hooks/useIsCooldownActive';

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
};

const defaultButtonClassName = 'str-chat__emoji-picker-button';

const classNames: Pick<
  EmojiPickerProps,
  'pickerContainerClassName' | 'wrapperClassName'
> = {
  pickerContainerClassName: 'str-chat__message-textarea-emoji-picker-container',
  wrapperClassName: 'str-chat__message-textarea-emoji-picker',
};

export const EmojiPicker = (props: EmojiPickerProps) => {
  const { t } = useTranslationContext('EmojiPicker');
  const { textareaRef } = useMessageComposerContext('EmojiPicker');
  const { textComposer } = useMessageComposerController();
  const isCooldownActive = useIsCooldownActive();
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

  const { pickerContainerClassName, wrapperClassName } = classNames;

  const { ButtonIconComponent = IconEmoji } = props;
  const pickerStyle = props.pickerProps?.style as React.CSSProperties | undefined;

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
            style={{ ...pickerStyle, '--shadow': 'none' }}
          />
        </div>
      )}
      <Button
        appearance='ghost'
        aria-expanded={displayPicker}
        aria-label={t('aria/Emoji picker')}
        circular
        className={props.buttonClassName ?? defaultButtonClassName}
        disabled={isCooldownActive}
        onClick={() => setDisplayPicker((cv) => !cv)}
        ref={setReferenceElement}
        size='sm'
        type='button'
        variant='secondary'
      >
        {ButtonIconComponent && <ButtonIconComponent />}
      </Button>
    </div>
  );
};
