import { type RefObject, useEffect } from 'react';

const syncChatViewSelectorMobileWidth = (layoutElement: HTMLDivElement) => {
  const selectorElement = layoutElement.querySelector<HTMLDivElement>(
    '.str-chat__chat-view__selector',
  );

  if (!selectorElement) return;

  const nextWidth = Math.ceil(
    Math.max(selectorElement.getBoundingClientRect().width, selectorElement.scrollWidth),
  );

  layoutElement.style.setProperty(
    '--str-chat__chat-view-selector-mobile-width',
    `${nextWidth}px`,
  );
};

// Keeps `--str-chat__chat-view-selector-mobile-width` equal to the view selector's rendered width.
export const ChatViewSelectorWidthSync = ({
  iconOnly,
  layoutRef,
}: {
  iconOnly: boolean;
  layoutRef: RefObject<HTMLDivElement | null>;
}) => {
  useEffect(() => {
    const layoutElement = layoutRef.current;

    if (!layoutElement) return;

    const selectorElement = layoutElement.querySelector<HTMLDivElement>(
      '.str-chat__chat-view__selector',
    );

    if (!selectorElement) return;

    const sync = () => {
      syncChatViewSelectorMobileWidth(layoutElement);
    };

    sync();
    window.addEventListener('resize', sync);

    if (typeof ResizeObserver === 'undefined') {
      return () => {
        window.removeEventListener('resize', sync);
      };
    }

    const resizeObserver = new ResizeObserver(sync);

    resizeObserver.observe(selectorElement);

    return () => {
      window.removeEventListener('resize', sync);
      resizeObserver.disconnect();
    };
  }, [iconOnly, layoutRef]);

  return null;
};
