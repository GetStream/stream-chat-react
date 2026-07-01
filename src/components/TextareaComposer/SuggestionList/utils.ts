import type { TextComposerSuggestion } from 'stream-chat';

/**
 * Returns the suggestion items in the exact order the list renders them. Command suggestions are
 * sorted alphabetically by name; every other trigger keeps the search-source order.
 *
 * This ordering is the single source of truth shared by {@link SuggestionList} (which derives the
 * per-option ids `{listboxId}-option-{index}` and the highlighted `focusedItemIndex` from it) and
 * by the composer's Enter handler (which selects `orderedItems[focusedItemIndex]`). Deriving it in
 * both places from the raw `searchSource.items` would let `aria-activedescendant` announce one
 * command while Enter inserts another.
 */
export const orderSuggestionItems = <T extends TextComposerSuggestion>(
  items: T[] | undefined,
  type: string | undefined,
): T[] =>
  type === 'commands'
    ? [...(items ?? [])].sort((a, b) =>
        String((a as { name?: string }).name ?? '').localeCompare(
          String((b as { name?: string }).name ?? ''),
        ),
      )
    : (items ?? []);
