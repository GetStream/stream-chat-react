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
  onSearchChange,
  onSelect,
  options,
  searchPlaceholder,
  searchQuery,
  selectedValue,
}: {
  onSearchChange: (value: string) => void;
  onSelect: (value: T) => void;
  options: SearchableSelectOption<T>[];
  searchPlaceholder: string;
  searchQuery: string;
  selectedValue: T;
}) => {
  const normalizedQuery = searchQuery.trim().toLowerCase();
  const filteredOptions = options.filter((option) =>
    option.label.toLowerCase().includes(normalizedQuery),
  );

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
      {filteredOptions.map((option) => (
        <SearchableSelectOptionItem
          key={option.value}
          onSelect={onSelect}
          option={option}
          selected={selectedValue === option.value}
        />
      ))}
      {filteredOptions.length === 0 && (
        <div className='app__searchable-select__dropdown-empty'>No matching options</div>
      )}
    </>
  );
};

export const SearchableSelect = <T extends string>({
  onChange,
  options,
  searchPlaceholder,
  value,
}: {
  onChange: (value: T) => void;
  options: SearchableSelectOption<T>[];
  searchPlaceholder: string;
  value: T;
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const selectedOption =
    options.find((option) => option.value === value) ?? options[0] ?? null;

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
            <span className='app__searchable-select__trigger-value'>
              {selectedOption?.label ?? ''}
            </span>
            <span aria-hidden='true' className='app__searchable-select__trigger-icon'>
              <IconChevronDown />
            </span>
          </button>
        );
      },
    [selectedOption],
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
