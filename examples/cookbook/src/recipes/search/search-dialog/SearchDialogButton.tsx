import { useEffect, useState } from 'react';
import type { PropsWithChildren } from 'react';
import { WithComponents } from 'stream-chat-react';
import { SearchDialog } from './SearchDialog';
import './SearchDialogButton.css';

const isMac = /Mac|iPhone|iPad/.test(navigator.userAgent);

const SearchDialogButton = () => {
  const [open, setOpen] = useState(false);

  // ⌘K on a Mac, Ctrl+K elsewhere, opens the dialog from anywhere in the app.
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // `key` is missing on the keydown Chrome fires when it autofills a field.
      if ((isMac ? event.metaKey : event.ctrlKey) && event.key?.toLowerCase() === 'k') {
        event.preventDefault();
        setOpen(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <div className='cookbook-search-trigger'>
      <button
        aria-haspopup='dialog'
        aria-keyshortcuts={isMac ? 'Meta+K' : 'Control+K'}
        className='cookbook-search-trigger__button'
        onClick={() => setOpen(true)}
        type='button'
      >
        <span>Search</span>
        <kbd className='cookbook-search-trigger__shortcut'>{isMac ? '⌘K' : 'Ctrl K'}</kbd>
      </button>
      <SearchDialog onClose={() => setOpen(false)} open={open} />
    </div>
  );
};

// Declared once, so WithComponents gets the same object on every render.
const overrides = { Search: SearchDialogButton };

/** Replaces the search above the channel list with a button that opens the search dialog. */
export const WithSearchDialog = ({ children }: PropsWithChildren) => (
  <WithComponents overrides={overrides}>{children}</WithComponents>
);
