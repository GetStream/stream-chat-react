import React, { createContext, type ReactNode, useContext, useState } from 'react';
import clsx from 'clsx';

import { useTranslationContext } from '../../../context/TranslationContext';
import { useComponentContextIcons } from '../../../context/useComponentContextIcons';
import { Dropdown, type DropdownTriggerProps } from '../../../components/Form/Dropdown';
import {
  AIThemeScope,
  ThemeScopeProvider,
  useAIThemeScopeClassName,
} from '../themeScope';

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
  selectedId?: string | null;
};

/**
 * The items of the chat options menu, one per option. `ChatOptions` shows them in the SDK's
 * `Dropdown`, which moves focus between them and closes on Escape. The counterpart of
 * `ChatOptionsList`.
 */
export const ChatOptionsList = ({
  onSelect,
  options,
  selectedId,
}: ChatOptionsListProps) => (
  // The items have no root of their own, so the scope wraps them when rendered on their own.
  <AIThemeScope>
    {options.map((option) => (
      <button
        aria-checked={option.id === selectedId}
        className='str-chat__ai-chat-options__item'
        key={option.id}
        onClick={() => onSelect(option)}
        role='menuitemradio'
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
  </AIThemeScope>
);

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
  const themeScopeClassName = useAIThemeScopeClassName();
  const { t } = useTranslationContext();
  const { IconXmarkSmall } = useComponentContextIcons();
  const title = option.shortTitle ?? option.title;
  return (
    <ThemeScopeProvider>
      <span
        className={clsx(
          themeScopeClassName,
          'str-chat__ai-chat-options__chip',
          className,
        )}
      >
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
    </ThemeScopeProvider>
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

// What the menu button needs beyond what `Dropdown` hands its trigger.
const ChatOptionsTriggerContext = createContext<{ disabled?: boolean; icon?: ReactNode }>(
  {},
);

// Defined once, since `Dropdown` closes whenever its trigger component changes.
const ChatOptionsTrigger = ({
  onClick,
  referenceRef,
  ...props
}: DropdownTriggerProps) => {
  const { t } = useTranslationContext();
  const { IconPlus } = useComponentContextIcons();
  const { disabled, icon } = useContext(ChatOptionsTriggerContext);
  return (
    <button
      {...props}
      aria-haspopup='menu'
      aria-label={t('aria/Chat options')}
      className='str-chat__ai-message-composer__round-button'
      disabled={disabled}
      onClick={onClick}
      ref={referenceRef as React.Ref<HTMLButtonElement>}
      type='button'
    >
      {icon ?? <IconPlus />}
    </button>
  );
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
  const themeScopeClassName = useAIThemeScopeClassName();
  const { t } = useTranslationContext();
  const [uncontrolledId, setUncontrolledId] = useState(defaultSelectedId);
  const selectedId = selectedIdProp === undefined ? uncontrolledId : selectedIdProp;
  const selected = options.find((option) => option.id === selectedId);

  const select = (option: AIChatOption | null) => {
    setUncontrolledId(option?.id ?? null);
    onSelectedChange?.(option);
  };

  return (
    <ThemeScopeProvider>
      <div className={clsx(themeScopeClassName, 'str-chat__ai-chat-options', className)}>
        <ChatOptionsTriggerContext.Provider value={{ disabled, icon }}>
          <Dropdown
            className='str-chat__ai-chat-options__list'
            placement='top-start'
            TriggerComponent={ChatOptionsTrigger}
          >
            <div aria-label={t('aria/Chat options')} role='group'>
              <ChatOptionsList
                onSelect={(option) => select(option.id === selectedId ? null : option)}
                options={options}
                selectedId={selectedId}
              />
            </div>
          </Dropdown>
        </ChatOptionsTriggerContext.Provider>
        {selected && (
          <SelectedChatOptionChip
            disabled={disabled}
            onRemove={() => select(null)}
            option={selected}
          />
        )}
        {name && <input name={name} type='hidden' value={selected?.id ?? ''} />}
      </div>
    </ThemeScopeProvider>
  );
};
