import React, { useEffect, useRef, useState } from 'react';

import { useMessageComposerContext, useTranslationContext } from '../../context';
import {
  Button,
  IconEmoji,
  type PopperLikePlacement,
  useMessageComposerController,
} from '../../components';
import { usePopoverPosition } from '../../components/Dialog/hooks/usePopoverPosition';
import { useIsCooldownActive } from '../../components/MessageComposer/hooks/useIsCooldownActive';
import { EmojiPickerPanel } from './components';
import { useFrequentlyUsedEmoji } from './hooks/useFrequentlyUsedEmoji';
import { useSkinTone } from './hooks/useSkinTone';
import {
  type EmojiPickerPassthroughProps,
  resolveEmojiPickerOptions,
  warnUnsupportedPickerProps,
} from './options';

const isShadowRoot = (node: Node): node is ShadowRoot => !!(node as ShadowRoot).host;

export type {
  EmojiPickerNavPosition,
  EmojiPickerPassthroughProps,
  EmojiPickerPreviewPosition,
  EmojiPickerSearchPosition,
  EmojiPickerSkinTonePosition,
} from './options';

export type EmojiPickerProps = {
  ButtonIconComponent?: React.ComponentType;
  buttonClassName?: string;
  pickerContainerClassName?: string;
  wrapperClassName?: string;
  closeOnEmojiSelect?: boolean;
  /**
   * Presentation + curated layout/behavior options for the picker panel, using
   * emoji-mart-compatible names (`theme`, `style`, `perLine`, `navPosition`,
   * `previewPosition`, `searchPosition`, `skinTonePosition`, `categories`,
   * `exceptEmojis`, `emojiVersion`, `maxFrequentRows`, `noCountryFlags`,
   * `previewEmoji`, `noResultsEmoji`, `autoFocus`, `onClickOutside`).
   *
   * Not every emoji-mart `Picker` option is supported: image sets (`set`,
   * `getSpritesheetURL`), `custom` emoji, `data`, `i18n`/`locale`, `dynamicWidth`,
   * `icons`, and `categoryIcons` are rejected by the type and ignored (with a console
   * warning) at runtime; sizing knobs (`emojiSize`, …) are CSS tokens instead. See the
   * emoji migration notes in `AI.md`.
   */
  pickerProps?: EmojiPickerPassthroughProps;
  /**
   * Floating UI placement (default: 'top-end') for the picker popover
   */
  placement?: PopperLikePlacement;
  /** Uncontrolled initial skin tone index (0 = default, 1–5 = light → dark). */
  defaultSkinTone?: number;
  /**
   * Controlled ordered list of recently used emoji ids (most recent first). The SDK
   * does not persist this — provide it (and `onFrequentlyUsedChange`) to control the
   * "frequently used" section; otherwise it is tracked in memory for the session.
   */
  frequentlyUsedEmoji?: string[];
  /** Called with the updated recently-used list when an emoji is selected. */
  onFrequentlyUsedChange?: (emojiIds: string[]) => void;
  /** Called with the new skin tone index when it changes. */
  onSkinToneChange?: (skinTone: number) => void;
  /** Controlled skin tone index (0 = default, 1–5 = light → dark). */
  skinTone?: number;
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
  // Skin tone and frequently-used live here (not in the panel) so they survive the
  // picker opening/closing — the panel below is mounted only while open.
  const [skinTone, setSkinTone] = useSkinTone({
    defaultSkinTone: props.defaultSkinTone,
    onSkinToneChange: props.onSkinToneChange,
    skinTone: props.skinTone,
  });
  const { frequentlyUsedIds, recordUse } = useFrequentlyUsedEmoji({
    frequentlyUsedEmoji: props.frequentlyUsedEmoji,
    onFrequentlyUsedChange: props.onFrequentlyUsedChange,
  });
  const [displayPicker, setDisplayPicker] = useState(false);
  const [referenceElement, setReferenceElement] = useState<HTMLButtonElement | null>(
    null,
  );
  const [popperElement, setPopperElement] = useState<HTMLDivElement | null>(null);
  const { refs, strategy, x, y } = usePopoverPosition({
    offset: 8,
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
  const pickerStyle = props.pickerProps?.style;
  const options = resolveEmojiPickerOptions(props.pickerProps);
  // Latest-ref so the click-outside listener isn't re-attached when the callback identity
  // changes between renders.
  const onClickOutsideRef = useRef(props.pickerProps?.onClickOutside);
  onClickOutsideRef.current = props.pickerProps?.onClickOutside;

  const pickerPropsKeys = Object.keys(props.pickerProps ?? {});
  useEffect(() => {
    warnUnsupportedPickerProps(props.pickerProps);
    // Re-check only when the set of provided keys changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pickerPropsKeys.join(',')]);

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

      onClickOutsideRef.current?.();
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
          <EmojiPickerPanel
            frequentlyUsedIds={frequentlyUsedIds}
            onClose={() => {
              setDisplayPicker(false);
              referenceElement?.focus();
            }}
            onEmojiSelect={(emoji) => {
              const textarea = textareaRef.current;
              if (!textarea) return;
              // Record only once we know the emoji is actually being inserted.
              recordUse(emoji.id);
              textComposer.insertText({ text: emoji.native });
              textarea.focus();
              if (props.closeOnEmojiSelect) {
                setDisplayPicker(false);
              }
            }}
            onSkinToneChange={setSkinTone}
            options={options}
            skinToneIndex={skinTone}
            style={pickerStyle}
            theme={props.pickerProps?.theme}
          />
        </div>
      )}
      <Button
        appearance='ghost'
        aria-expanded={displayPicker}
        aria-haspopup='dialog'
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
