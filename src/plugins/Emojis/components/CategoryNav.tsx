import { type KeyboardEvent, useRef } from 'react';
import clsx from 'clsx';
import { EMOJI_CATEGORY_META } from './categories';
import { useEmojiPickerContext } from '../context/EmojiPickerContext';

const NAV_KEYS = ['ArrowRight', 'ArrowLeft', 'Home', 'End'];

/**
 * Top navigation bar with one tab per category (role="tablist"). Clicking a tab
 * scrolls its section into view; Left/Right/Home/End move focus between tabs with a
 * roving tabindex; the active tab reflects the currently visible section. Reads the
 * category model + active category from context and reports clicks via
 * `requestScrollToCategory`. The active tab is suppressed during search.
 */
export const CategoryNav = () => {
  const { activeCategoryId, categories, isSearching, requestScrollToCategory } =
    useEmojiPickerContext();
  const navRef = useRef<HTMLDivElement>(null);
  const active = isSearching ? undefined : activeCategoryId;
  const rovingId = active ?? categories[0]?.id;

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (!NAV_KEYS.includes(event.key)) return;
    const tabs = Array.from(
      navRef.current?.querySelectorAll<HTMLButtonElement>('[role="tab"]') ?? [],
    );
    const index = tabs.findIndex((tab) => tab === document.activeElement);
    if (index === -1) return;
    event.preventDefault();
    const lastIndex = tabs.length - 1;
    let next = index;
    if (event.key === 'ArrowRight') next = Math.min(index + 1, lastIndex);
    else if (event.key === 'ArrowLeft') next = Math.max(index - 1, 0);
    else if (event.key === 'Home') next = 0;
    else if (event.key === 'End') next = lastIndex;
    tabs[next]?.focus();
  };

  return (
    <div
      className='str-chat__emoji-picker__category-nav'
      onKeyDown={onKeyDown}
      ref={navRef}
      role='tablist'
    >
      {categories.map(({ id, label }) => (
        <button
          aria-label={label}
          aria-selected={active === id}
          className={clsx('str-chat__emoji-picker__category-nav-button', {
            'str-chat__emoji-picker__category-nav-button--active': active === id,
          })}
          key={id}
          onClick={() => requestScrollToCategory(id)}
          role='tab'
          tabIndex={id === rovingId ? 0 : -1}
          type='button'
        >
          <span aria-hidden='true'>{EMOJI_CATEGORY_META[id]?.glyph ?? '•'}</span>
        </button>
      ))}
    </div>
  );
};
