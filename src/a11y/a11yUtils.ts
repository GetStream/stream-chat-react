const MENU_KEYBOARD_NAVIGATION_KEYS = ['ArrowDown', 'ArrowUp', 'End', 'Home'] as const;

type MenuKeyboardNavigationKey = (typeof MENU_KEYBOARD_NAVIGATION_KEYS)[number];

const isMenuKeyboardNavigationKey = (key: string): key is MenuKeyboardNavigationKey =>
  (MENU_KEYBOARD_NAVIGATION_KEYS as readonly string[]).includes(key);

type GetNextRovingFocusIndexArgs = {
  activeIndex: number;
  itemCount: number;
  key: string;
};

export const getNextRovingFocusIndex = ({
  activeIndex,
  itemCount,
  key,
}: GetNextRovingFocusIndexArgs): number | null => {
  if (itemCount <= 0 || !isMenuKeyboardNavigationKey(key)) return null;

  const lastIndex = itemCount - 1;

  if (key === 'Home') return 0;
  if (key === 'End') return lastIndex;
  if (activeIndex === -1) return key === 'ArrowUp' ? lastIndex : 0;
  if (key === 'ArrowUp') return activeIndex <= 0 ? lastIndex : activeIndex - 1;

  return activeIndex >= lastIndex ? 0 : activeIndex + 1;
};

type RovingFocusKeyboardEvent = {
  currentTarget: Element;
  key: string;
  preventDefault: () => void;
};

type CreateRovingFocusKeyDownHandlerParams<T extends { focus: () => void }> = {
  focusItem?: (item: T, event: RovingFocusKeyboardEvent) => void;
  getActiveIndex?: (items: T[], event: RovingFocusKeyboardEvent) => number;
  getItems: (event: RovingFocusKeyboardEvent) => T[];
};

const getDefaultActiveIndex = <T extends { focus: () => void }>(items: T[]) => {
  const activeElement = document.activeElement;
  if (!(activeElement instanceof Element)) return -1;

  return items.findIndex((item) => item instanceof Element && item === activeElement);
};

export const createRovingFocusKeyDownHandler = <T extends { focus: () => void }>({
  focusItem = (item) => item.focus(),
  getActiveIndex = (items) => getDefaultActiveIndex(items),
  getItems,
}: CreateRovingFocusKeyDownHandlerParams<T>) => {
  const handleKeyDown = (event: RovingFocusKeyboardEvent) => {
    const items = getItems(event);
    const activeIndex = getActiveIndex(items, event);
    const nextIndex = getNextRovingFocusIndex({
      activeIndex,
      itemCount: items.length,
      key: event.key,
    });

    if (nextIndex === null) return;

    event.preventDefault();
    const nextItem = items[nextIndex];
    if (!nextItem) return;
    focusItem(nextItem, event);
  };

  return handleKeyDown;
};
