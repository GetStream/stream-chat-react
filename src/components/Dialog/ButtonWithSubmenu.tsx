import clsx from 'clsx';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useDialog, useDialogIsOpen } from './hooks';
import { useDialogAnchor } from './DialogAnchor';
import type { ComponentProps, ComponentType } from 'react';
import type { Placement } from '@popperjs/core';

type ButtonWithSubmenu = ComponentProps<'button'> & {
  children: React.ReactNode;
  placement: Placement;
  Submenu: ComponentType;
  submenuContainerProps?: ComponentProps<'div'>;
};
export const ButtonWithSubmenu = ({
  children,
  className,
  placement,
  Submenu,
  submenuContainerProps,
  ...buttonProps
}: ButtonWithSubmenu) => {
  const buttonRef = useRef<HTMLButtonElement | null>(null);
  const [dialogContainer, setDialogContainer] = useState<HTMLDivElement | null>(null);
  const keepSubmenuOpen = useRef(false);
  const dialogCloseTimeout = useRef<NodeJS.Timeout | null>(null);
  const dialogId = useMemo(() => `submenu-${Math.random().toString(36).slice(2)}`, []);
  const dialog = useDialog({ id: dialogId });
  const dialogIsOpen = useDialogIsOpen(dialogId);
  const { attributes, setPopperElement, styles } = useDialogAnchor<HTMLDivElement>({
    open: dialogIsOpen,
    placement,
    referenceElement: buttonRef.current,
  });

  const closeDialogLazily = useCallback(() => {
    if (dialogCloseTimeout.current) clearTimeout(dialogCloseTimeout.current);
    dialogCloseTimeout.current = setTimeout(() => {
      if (keepSubmenuOpen.current) return;
      dialog.close();
    }, 100);
  }, [dialog]);

  const handleClose = useCallback(
    (event: Event) => {
      const parentButton = buttonRef.current;
      if (!dialogIsOpen || !parentButton) return;
      event.stopPropagation();
      closeDialogLazily();
      parentButton.focus();
    },
    [closeDialogLazily, dialogIsOpen, buttonRef],
  );

  const handleFocusParentButton = () => {
    if (dialogIsOpen) return;
    dialog.open();
    keepSubmenuOpen.current = true;
  };

  useEffect(() => {
    const parentButton = buttonRef.current;
    if (!dialogIsOpen || !parentButton) return;
    const hideOnEscape = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      handleClose(event);
      keepSubmenuOpen.current = false;
    };

    document.addEventListener('keyup', hideOnEscape, { capture: true });

    return () => {
      document.removeEventListener('keyup', hideOnEscape, { capture: true });
    };
  }, [dialogIsOpen, handleClose]);

  return (
    <>
      <button
        aria-selected='false'
        className={clsx(className, 'str_chat__button-with-submenu', {
          'str_chat__button-with-submenu--submenu-open': dialogIsOpen,
        })}
        onBlur={() => {
          keepSubmenuOpen.current = false;
          closeDialogLazily();
        }}
        onClick={(event) => {
          event.stopPropagation();
          dialog.toggle();
        }}
        onFocus={handleFocusParentButton}
        onMouseEnter={handleFocusParentButton}
        onMouseLeave={() => {
          keepSubmenuOpen.current = false;
          closeDialogLazily();
        }}
        ref={buttonRef}
        role='option'
        {...buttonProps}
      >
        {children}
      </button>
      {dialogIsOpen && (
        <div
          {...attributes.popper}
          onBlur={(event) => {
            const isBlurredDescendant =
              event.relatedTarget instanceof Node &&
              dialogContainer?.contains(event.relatedTarget);
            if (isBlurredDescendant) return;
            keepSubmenuOpen.current = false;
            closeDialogLazily();
          }}
          onFocus={() => {
            keepSubmenuOpen.current = true;
          }}
          onMouseEnter={() => {
            keepSubmenuOpen.current = true;
          }}
          onMouseLeave={() => {
            keepSubmenuOpen.current = false;
            closeDialogLazily();
          }}
          ref={(element) => {
            setPopperElement(element);
            setDialogContainer(element);
          }}
          style={styles.popper}
          tabIndex={-1}
          {...submenuContainerProps}
        >
          <Submenu />
        </div>
      )}
    </>
  );
};
