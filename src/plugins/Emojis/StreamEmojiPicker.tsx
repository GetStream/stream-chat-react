import React, { type CSSProperties, useEffect, useRef, useState } from 'react';

import { useMessageComposerContext, useTranslationContext } from '../../context';
import {
  Button,
  IconEmoji,
  type PopperLikePlacement,
  useMessageComposerController,
} from '../../components';
import { usePopoverPosition } from '../../components/Dialog/hooks/usePopoverPosition';
import { useIsCooldownActive } from '../../components/MessageComposer/hooks/useIsCooldownActive';
import { CategoryNav } from './components/CategoryNav';
import { EmojiGrid } from './components/EmojiGrid';
import { EmojiPickerPanel } from './components/EmojiPickerPanel';
import { EmojiPickerRoot } from './components/EmojiPickerRoot';
import { PreviewPane } from './components/PreviewPane';
import { SearchInput } from './components/SearchInput';
import { SkinToneSelector } from './components/SkinToneSelector';
import { useFrequentlyUsedEmoji } from './hooks/useFrequentlyUsedEmoji';
import { useSkinTone } from './hooks/useSkinTone';

const isShadowRoot = (node: Node): node is ShadowRoot => !!(node as ShadowRoot).host;

export type StreamEmojiPickerProps = {
  ButtonIconComponent?: React.ComponentType;
  buttonClassName?: string;
  pickerContainerClassName?: string;
  wrapperClassName?: string;
  closeOnEmojiSelect?: boolean;
  /** Floating UI placement (default: 'top-end') for the picker popover. */
  placement?: PopperLikePlacement;
  /** Focus the search input when the picker opens (default `true`). */
  autoFocus?: boolean;
  /** Category ids to show, in order. Defaults to the dataset order. `frequent` always prepends. */
  categories?: string[];
  /** Emoji ids to exclude from the grid and search. */
  exceptEmojis?: string[];
  /** Called when a pointer press lands outside the open picker. */
  onClickOutside?: () => void;
  /** Inline styles applied to the picker panel root. */
  style?: CSSProperties;
  /** Color theme. 'auto' (default) inherits the ancestor SDK theme; 'light'/'dark' force it. */
  theme?: 'auto' | 'light' | 'dark';
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
  StreamEmojiPickerProps,
  'pickerContainerClassName' | 'wrapperClassName'
> = {
  pickerContainerClassName: 'str-chat__message-textarea-emoji-picker-container',
  wrapperClassName: 'str-chat__message-textarea-emoji-picker',
};

const StreamEmojiPickerComponent = (props: StreamEmojiPickerProps) => {
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
  // Latest-ref so the click-outside listener isn't re-attached when the callback identity
  // changes between renders.
  const onClickOutsideRef = useRef(props.onClickOutside);
  onClickOutsideRef.current = props.onClickOutside;

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
            autoFocus={props.autoFocus}
            categories={props.categories}
            exceptEmojis={props.exceptEmojis}
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
            style={props.style}
            theme={props.theme}
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

/**
 * The built-in emoji picker. Rendered directly, it is the batteries-included preset
 * (toggle button + popover + the standard panel). For a custom layout, compose the parts
 * — `StreamEmojiPicker.Root` wrapping any arrangement of `.Nav` / `.Search` / `.Grid` /
 * `.Preview` / `.SkinTone` (and your own slots via `useEmojiPickerContext`).
 */
export const StreamEmojiPicker = Object.assign(StreamEmojiPickerComponent, {
  Grid: EmojiGrid,
  Nav: CategoryNav,
  Preview: PreviewPane,
  Root: EmojiPickerRoot,
  Search: SearchInput,
  SkinTone: SkinToneSelector,
});
