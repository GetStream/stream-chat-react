import React, {
  type KeyboardEvent,
  type ReactNode,
  useEffect,
  useRef,
  useState,
} from 'react';
import clsx from 'clsx';

import { useTranslationContext } from '../../../context/TranslationContext';
import { useComponentContextIcons } from '../../../context/useComponentContextIcons';
import { useStableId } from '../../../components/UtilityComponents/useStableId';

/**
 * A way to ask, which the person picks for their next message, such as "Think harder". The
 * counterpart of `ChatOption` in StreamChatAI.
 */
export type AIChatOption = {
  id: string;
  /** The option's name in the menu, such as "Think harder". */
  title: string;
  /** Data of your own, such as what the option sends with the message. */
  customData?: Record<string, unknown>;
  /** A line under the title in the menu, such as "Takes longer, for harder questions". */
  description?: string;
  /** An icon shown in the menu and on the chip. */
  icon?: ReactNode;
  /** The option's name on the chip once picked, such as "Think". Defaults to `title`. */
  shortTitle?: string;
};

export type ChatOptionsListProps = {
  onSelect: (option: AIChatOption) => void;
  options: AIChatOption[];
  className?: string;
  id?: string;
  /** Called when the person leaves the list with Escape or Tab. */
  onDismiss?: () => void;
  selectedId?: string | null;
};

/** The menu of chat options. The counterpart of `ChatOptionsList`. */
export const ChatOptionsList = ({
  className,
  id,
  onDismiss,
  onSelect,
  options,
  selectedId,
}: ChatOptionsListProps) => {
  const { t } = useTranslationContext();
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const items = listRef.current?.querySelectorAll<HTMLElement>(
      '[role="menuitemradio"]',
    );
    const selected = [...(items ?? [])].find(
      (item) => item.getAttribute('aria-checked') === 'true',
    );
    (selected ?? items?.[0])?.focus();
  }, []);

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const items = [
      ...(listRef.current?.querySelectorAll<HTMLElement>('[role="menuitemradio"]') ?? []),
    ];
    const index = items.indexOf(document.activeElement as HTMLElement);
    const move = (to: number) => {
      event.preventDefault();
      items[(to + items.length) % items.length]?.focus();
    };
    if (event.key === 'ArrowDown') move(index + 1);
    else if (event.key === 'ArrowUp') move(index - 1);
    else if (event.key === 'Home') move(0);
    else if (event.key === 'End') move(items.length - 1);
    else if (event.key === 'Escape' || event.key === 'Tab') onDismiss?.();
  };

  return (
    <div
      aria-label={t('aria/Chat options')}
      className={clsx('str-chat__ai-chat-options__list', className)}
      id={id}
      onKeyDown={onKeyDown}
      ref={listRef}
      role='menu'
    >
      {options.map((option) => (
        <button
          aria-checked={option.id === selectedId}
          className='str-chat__ai-chat-options__item'
          key={option.id}
          onClick={() => onSelect(option)}
          role='menuitemradio'
          tabIndex={-1}
          type='button'
        >
          {option.icon && (
            <span className='str-chat__ai-chat-options__item-icon'>{option.icon}</span>
          )}
          <span className='str-chat__ai-chat-options__item-text'>
            <span className='str-chat__ai-chat-options__item-title'>{option.title}</span>
            {option.description && (
              <span className='str-chat__ai-chat-options__item-description'>
                {option.description}
              </span>
            )}
          </span>
        </button>
      ))}
    </div>
  );
};

export type SelectedChatOptionChipProps = {
  onRemove: () => void;
  option: AIChatOption;
  className?: string;
  disabled?: boolean;
};

/** The picked option, with a button that removes it. The counterpart of `SelectedChatOptionChip`. */
export const SelectedChatOptionChip = ({
  className,
  disabled,
  onRemove,
  option,
}: SelectedChatOptionChipProps) => {
  const { t } = useTranslationContext();
  const { IconXmarkSmall } = useComponentContextIcons();
  const title = option.shortTitle ?? option.title;
  return (
    <span className={clsx('str-chat__ai-chat-options__chip', className)}>
      {option.icon && (
        <span className='str-chat__ai-chat-options__chip-icon'>{option.icon}</span>
      )}
      <span className='str-chat__ai-chat-options__chip-title'>{title}</span>
      <button
        aria-label={t('aria/Remove option: {{ option }}', { option: title })}
        className='str-chat__ai-chat-options__chip-remove'
        disabled={disabled}
        onClick={onRemove}
        type='button'
      >
        <IconXmarkSmall />
      </button>
    </span>
  );
};

export type ChatOptionsProps = {
  options: AIChatOption[];
  className?: string;
  /** The option picked at first, when uncontrolled. */
  defaultSelectedId?: string | null;
  disabled?: boolean;
  /** The menu button's icon. Defaults to a plus. */
  icon?: ReactNode;
  /** Submits the picked option's id with the composer's form under this name. */
  name?: string;
  /** Called when the person picks an option, or removes it with `null`. */
  onSelectedChange?: (option: AIChatOption | null) => void;
  /** The picked option's id, when controlled. */
  selectedId?: string | null;
};

/**
 * A menu of ways to ask, such as "Think harder", and a chip for the one picked, with a button
 * that removes it. Place it inside `AIMessageComposer`; with `name`, the picked option's id is
 * submitted with the form. The counterpart of the chat options of `AIComposerView`.
 */
export const ChatOptions = ({
  className,
  defaultSelectedId = null,
  disabled,
  icon,
  name,
  onSelectedChange,
  options,
  selectedId: selectedIdProp,
}: ChatOptionsProps) => {
  const { t } = useTranslationContext();
  const { IconPlus } = useComponentContextIcons();
  const listId = `str-chat__ai-chat-options-${useStableId()}`;
  const [isOpen, setIsOpen] = useState(false);
  const [uncontrolledId, setUncontrolledId] = useState(defaultSelectedId);
  const selectedId = selectedIdProp === undefined ? uncontrolledId : selectedIdProp;
  const selected = options.find((option) => option.id === selectedId);
  const rootRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    const onPointerDown = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setIsOpen(false);
    };
    document.addEventListener('pointerdown', onPointerDown);
    return () => document.removeEventListener('pointerdown', onPointerDown);
  }, [isOpen]);

  const select = (option: AIChatOption | null) => {
    setUncontrolledId(option?.id ?? null);
    onSelectedChange?.(option);
  };

  return (
    <div className={clsx('str-chat__ai-chat-options', className)} ref={rootRef}>
      <button
        aria-controls={isOpen ? listId : undefined}
        aria-expanded={isOpen}
        aria-haspopup='menu'
        aria-label={t('aria/Chat options')}
        className='str-chat__ai-message-composer__round-button'
        disabled={disabled}
        onClick={() => setIsOpen((open) => !open)}
        ref={buttonRef}
        type='button'
      >
        {icon ?? <IconPlus />}
      </button>
      {isOpen && (
        <ChatOptionsList
          id={listId}
          onDismiss={() => {
            setIsOpen(false);
            buttonRef.current?.focus();
          }}
          onSelect={(option) => {
            setIsOpen(false);
            select(option.id === selectedId ? null : option);
            buttonRef.current?.focus();
          }}
          options={options}
          selectedId={selectedId}
        />
      )}
      {selected && (
        <SelectedChatOptionChip
          disabled={disabled}
          onRemove={() => select(null)}
          option={selected}
        />
      )}
      {name && <input name={name} type='hidden' value={selected?.id ?? ''} />}
    </div>
  );
};
