import React, { useEffect, useState } from 'react';

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

const isShadowRoot = (node: Node): node is ShadowRoot => !!(node as ShadowRoot).host;

/** The only `pickerProps` keys the built-in picker reads. */
const SUPPORTED_PICKER_PROP_KEYS = ['style', 'theme'];

export type EmojiPickerPassthroughProps = {
  /** Inline styles applied to the picker panel root. */
  style?: React.CSSProperties;
  /**
   * Color theme. 'auto' (default) inherits the ancestor SDK theme
   * (`.str-chat__theme-*`); 'light' / 'dark' force the panel to that theme.
   */
  theme?: 'auto' | 'light' | 'dark';
};

export type EmojiPickerProps = {
  ButtonIconComponent?: React.ComponentType;
  buttonClassName?: string;
  pickerContainerClassName?: string;
  wrapperClassName?: string;
  closeOnEmojiSelect?: boolean;
  /**
   * Presentation options for the picker panel — `theme` and `style` only.
   *
   * This is NOT emoji-mart's `Picker` prop bag: emoji-mart options (`data`, `set`,
   * `custom`, `categories`, `perLine`, `emojiVersion`, `locale`, `previewPosition`,
   * …) are not supported by the built-in picker. The type rejects them, and any that
   * reach runtime (e.g. via `as` casts) are ignored with a console warning. See the
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

  const pickerPropsKeys = Object.keys(props.pickerProps ?? {});
  useEffect(() => {
    const ignored = pickerPropsKeys.filter(
      (key) => !SUPPORTED_PICKER_PROP_KEYS.includes(key),
    );
    if (ignored.length) {
      console.warn(
        `[stream-chat-react] EmojiPicker ignored unsupported pickerProps: ${ignored.join(', ')}. ` +
          "Only 'theme' and 'style' are supported; emoji-mart Picker options are no longer available.",
      );
    }
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
