import { useEffect } from 'react';

// Tag the list's `[role="listbox"]` with a stable id so the skip-navigation links can target it. The
// listbox unmounts/remounts (search mode, view switches, reloads) and its view may start inactive, so
// observe `document.body` and re-tag whenever it (re)appears. The selector is globally unambiguous —
// only one view's sidebar is mounted at a time.
export const useTagSkipNavigationListbox = (
  listboxSelector: string,
  targetId: string,
) => {
  useEffect(() => {
    const tagListbox = () => {
      const listbox = document.querySelector<HTMLElement>(listboxSelector);
      if (listbox && listbox.id !== targetId) {
        listbox.id = targetId;
      }
    };

    tagListbox();
    const observer = new MutationObserver(tagListbox);
    observer.observe(document.body, { childList: true, subtree: true });
    return () => observer.disconnect();
  }, [listboxSelector, targetId]);
};
