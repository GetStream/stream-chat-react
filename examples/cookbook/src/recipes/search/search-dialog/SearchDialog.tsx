import { useEffect, useId, useRef, useState } from 'react';
import type { KeyboardEvent } from 'react';
import type { SearchControllerState, SearchSource, SearchSourceState } from 'stream-chat';
import { GlobalModal, useChatContext, useStateStore } from 'stream-chat-react';
import { searchAgain } from './searchController';
import { SearchFilters } from './SearchFilters';
import { SearchResults } from './SearchResults';
import type { ResultsLayout } from './SearchResults';
import './SearchDialog.css';

const sourceLabels: Record<string, string> = {
  channels: 'Channels',
  messages: 'Messages',
  users: 'People',
};

const controllerSelector = ({ searchQuery, sources }: SearchControllerState) => ({
  searchQuery,
  sources,
});

const isActiveSelector = ({ isActive }: SearchSourceState) => ({ isActive });

const SourceToggle = ({ source }: { source: SearchSource }) => {
  const { searchController } = useChatContext();
  const { isActive } = useStateStore(source.state, isActiveSelector);
  // The last active source can't be turned off.
  const isLastActive = isActive && searchController.activeSources.length === 1;

  return (
    <label className='cookbook-search-dialog__chip'>
      <input
        checked={isActive}
        disabled={isLastActive}
        onChange={(event) => {
          if (event.target.checked) {
            searchController.activateSource(source.type);
            // Activating a source doesn't search it, so run the current text in it.
            searchAgain(searchController, source);
          } else {
            searchController.deactivateSource(source.type);
          }
        }}
        type='checkbox'
      />
      {sourceLabels[source.type] ?? source.type}
    </label>
  );
};

/** Moves the focus between the search input and the results with the arrow keys. */
const moveFocus = (
  event: KeyboardEvent<HTMLDivElement>,
  input: HTMLInputElement | null,
) => {
  if (event.key !== 'ArrowDown' && event.key !== 'ArrowUp') return;
  const results = [
    ...event.currentTarget.querySelectorAll<HTMLElement>('[data-search-result]'),
  ];
  const index = results.indexOf(event.target as HTMLElement);
  if (!results.length || (index === -1 && event.target !== input)) return;
  event.preventDefault();
  const next =
    event.key === 'ArrowDown' ? Math.min(index + 1, results.length - 1) : index - 1;
  (next < 0 ? input : results[next])?.focus();
};

type SearchDialogProps = {
  onClose: () => void;
  open: boolean;
};

export const SearchDialog = ({ onClose, open }: SearchDialogProps) => {
  const { searchController } = useChatContext();
  const { searchQuery, sources } = useStateStore(
    searchController.state,
    controllerSelector,
  );
  const [layout, setLayout] = useState<ResultsLayout>('grouped');
  const [filtersOpen, setFiltersOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const id = useId();

  // No source is active the first time the dialog opens, so it turns them all on. Later, the
  // sources stay as the user left them: SearchController.exit() doesn't turn them off. The dialog
  // doesn't call SearchController.activate(): that marks search as open, and ChannelNavigation
  // would hide the channel lists behind the dialog.
  useEffect(() => {
    if (!open || searchController.activeSources.length) return;
    searchController.sources.forEach((source) =>
      searchController.activateSource(source.type),
    );
  }, [open, searchController]);

  const close = () => {
    // Empties the text and every source's results, and cancels the queries in flight.
    searchController.exit();
    onClose();
  };

  return (
    <GlobalModal aria-labelledby={`${id}-title`} onClose={close} open={open}>
      <div
        className='cookbook-search-dialog'
        onKeyDown={(event) => moveFocus(event, inputRef.current)}
      >
        <div className='cookbook-search-dialog__header'>
          <h2 className='cookbook-search-dialog__title' id={`${id}-title`}>
            Search
          </h2>
          <button
            aria-keyshortcuts='Escape'
            className='cookbook-search-dialog__close'
            onClick={close}
            type='button'
          >
            Close
          </button>
        </div>
        {/* The dialog's content mounts a render after the modal opens, so the input takes the
            focus itself. */}
        <input
          aria-label='Search channels, people and messages'
          autoFocus
          className='cookbook-search-dialog__input'
          onChange={(event) => {
            const text = event.target.value;
            if (text) void searchController.search(text);
            // An empty text doesn't search, so clear the results instead.
            else searchController.exit();
          }}
          placeholder='Search channels, people and messages'
          ref={inputRef}
          type='search'
          value={searchQuery ?? ''}
        />
        <div className='cookbook-search-dialog__toolbar'>
          <fieldset className='cookbook-search-dialog__options'>
            <legend className='cookbook-search-dialog__legend'>Search in</legend>
            {sources.map((source) => (
              <SourceToggle key={source.type} source={source} />
            ))}
          </fieldset>
          <fieldset className='cookbook-search-dialog__options'>
            <legend className='cookbook-search-dialog__legend'>Show</legend>
            {(['grouped', 'mixed'] as const).map((value) => (
              <label className='cookbook-search-dialog__chip' key={value}>
                <input
                  checked={layout === value}
                  name={`${id}-layout`}
                  onChange={() => setLayout(value)}
                  type='radio'
                  value={value}
                />
                {value === 'grouped' ? 'Grouped' : 'Mixed'}
              </label>
            ))}
          </fieldset>
          <button
            aria-controls={`${id}-filters`}
            aria-expanded={filtersOpen}
            className='cookbook-search-dialog__filters-button'
            onClick={() => setFiltersOpen((isOpen) => !isOpen)}
            type='button'
          >
            Filters and sort
          </button>
        </div>
        {filtersOpen && <SearchFilters id={`${id}-filters`} />}
        {searchQuery ? (
          <SearchResults close={close} layout={layout} />
        ) : (
          <p className='cookbook-search-dialog__hint'>
            Type to search. ↑ and ↓ move between results, Enter opens one.
          </p>
        )}
      </div>
    </GlobalModal>
  );
};
