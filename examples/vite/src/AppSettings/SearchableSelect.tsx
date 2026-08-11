import type { Ref } from 'react';
import { useMemo, useState } from 'react';
import {
  Dropdown,
  type DropdownTriggerProps,
  IconChevronDown,
  useDropdownContext,
} from 'stream-chat-react';

// A searchable single-select built on the SDK `Dropdown` (matches the reference-element width,
// has a filter input, and menuitemradio options). Extracted so the WebSocket-event trigger modal
// and the AppSettings tabs share one styled selector. Styles live in `AppSettings.scss` under the
// `app__searchable-select__*` class names, which the WebSocket-event dialog's own inline pickers
// reuse for the same trigger/dropdown primitives.

export type SearchableSelectOption<T extends string> = {
  label: string;
  value: T;
};

export const assignReferenceRef = (
  referenceRef: Ref<HTMLElement> | undefined,
  element: HTMLButtonElement | null,
) => {
  if (!referenceRef) return;

  if (typeof referenceRef === 'function') {
    referenceRef(element);
    return;
  }

  referenceRef.current = element;
};

const SearchableSelectOptionItem = <T extends string>({
  onSelect,
  option,
  selected,
}: {
  onSelect: (value: T) => void;
  option: SearchableSelectOption<T>;
  selected: boolean;
}) => {
  const { close } = useDropdownContext();

  return (
    <button
      aria-checked={selected}
      className='app__searchable-select__dropdown-item'
      onClick={() => {
        onSelect(option.value);
        close();
      }}
      role='menuitemradio'
      type='button'
    >
      <span className='app__searchable-select__dropdown-item-label'>{option.label}</span>
    </button>
  );
};

const SearchableSelectDropdownItems = <T extends string>({
  allowCustomValue,
  onSearchChange,
  onSelect,
  options,
  searchPlaceholder,
  searchQuery,
  selectedValue,
}: {
  allowCustomValue: boolean;
  onSearchChange: (value: string) => void;
  onSelect: (value: T) => void;
  options: SearchableSelectOption<T>[];
  searchPlaceholder: string;
  searchQuery: string;
  selectedValue: T;
}) => {
  const trimmedQuery = searchQuery.trim();
  const normalizedQuery = trimmedQuery.toLowerCase();
  const filteredOptions = options.filter((option) =>
    option.label.toLowerCase().includes(normalizedQuery),
  );
  // Lets the caller target something the option list does not know about. Offered only when the
  // query cannot be satisfied from the list, or already looks fully qualified (`type:id`), so it
  // does not clutter ordinary searches that do match.
  const customOption =
    allowCustomValue &&
    trimmedQuery &&
    (trimmedQuery.includes(':') || filteredOptions.length === 0) &&
    !options.some((option) => option.value === trimmedQuery)
      ? ({ label: `Use "${trimmedQuery}"`, value: trimmedQuery as T } as const)
      : null;

  return (
    <>
      <div
        className='app__searchable-select__dropdown-search'
        onClick={(event) => event.stopPropagation()}
        onMouseDown={(event) => event.stopPropagation()}
      >
        <input
          autoFocus
          className='app__searchable-select__dropdown-search-input'
          onChange={(event) => onSearchChange(event.target.value)}
          placeholder={searchPlaceholder}
          type='text'
          value={searchQuery}
        />
      </div>
      {customOption && (
        <SearchableSelectOptionItem
          onSelect={onSelect}
          option={customOption}
          selected={selectedValue === customOption.value}
        />
      )}
      {filteredOptions.map((option) => (
        <SearchableSelectOptionItem
          key={option.value}
          onSelect={onSelect}
          option={option}
          selected={selectedValue === option.value}
        />
      ))}
      {filteredOptions.length === 0 && !customOption && (
        <div className='app__searchable-select__dropdown-empty'>No matching options</div>
      )}
    </>
  );
};

export const SearchableSelect = <T extends string>({
  allowCustomValue = false,
  emptyLabel,
  onChange,
  options,
  searchPlaceholder,
  value,
}: {
  /** Offer the raw search query as a selectable option when it matches nothing. */
  allowCustomValue?: boolean;
  /** Trigger text when `value` matches no option. Defaults to the existing first-option fallback. */
  emptyLabel?: string;
  onChange: (value: T) => void;
  options: SearchableSelectOption<T>[];
  searchPlaceholder: string;
  value: T;
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const selectedOption = options.find((option) => option.value === value) ?? null;
  // With a free-text value the trigger must show what was typed even though it is not an option.
  // Falls back to the first option only when neither new prop is in play, preserving the previous
  // behaviour for existing callers.
  const triggerLabel =
    selectedOption?.label ??
    (allowCustomValue && value ? value : undefined) ??
    emptyLabel ??
    options[0]?.label ??
    '';

  const TriggerComponent = useMemo(
    () =>
      function SearchableSelectTrigger({
        onClick,
        referenceRef,
        ...props
      }: DropdownTriggerProps) {
        return (
          <button
            {...props}
            className='app__searchable-select app__searchable-select__trigger'
            onClick={onClick}
            ref={(element) => assignReferenceRef(referenceRef, element)}
            type='button'
          >
            <span className='app__searchable-select__trigger-value'>{triggerLabel}</span>
            <span aria-hidden='true' className='app__searchable-select__trigger-icon'>
              <IconChevronDown />
            </span>
          </button>
        );
      },
    [triggerLabel],
  );

  return (
    <Dropdown
      className='app__searchable-select__dropdown'
      fitAvailableSpace
      matchReferenceWidth
      onClose={() => setSearchQuery('')}
      onOpen={() => setSearchQuery('')}
      placement='bottom-start'
      TriggerComponent={TriggerComponent}
    >
      <SearchableSelectDropdownItems
        allowCustomValue={allowCustomValue}
        onSearchChange={setSearchQuery}
        onSelect={onChange}
        options={options}
        searchPlaceholder={searchPlaceholder}
        searchQuery={searchQuery}
        selectedValue={value}
      />
    </Dropdown>
  );
};
