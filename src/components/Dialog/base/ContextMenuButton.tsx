import clsx from 'clsx';
import type { ComponentProps, ComponentType, ReactNode } from 'react';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { PopperLikePlacement } from '../hooks';
import { useDialogIsOpen, useDialogOnNearestManager } from '../hooks';
import { useDialogAnchor } from '../service';
import { IconChevronRight } from '../../Icons';
import { Avatar, type AvatarProps } from '../../Avatar';

export type BaseContextMenuButtonProps = {
  details?: ReactNode;
  hasSubMenu?: boolean;
  label?: ReactNode;
  Icon?: ComponentType<ComponentProps<'svg'>>;
  SubmenuIcon?: ComponentType<ComponentProps<'svg'>>;
} & ComponentProps<'button'>;

export const BaseContextMenuButton = ({
  children,
  className,
  details,
  hasSubMenu,
  Icon,
  label,
  SubmenuIcon = IconChevronRight,
  ...props
}: BaseContextMenuButtonProps) => (
  <button
    {...props}
    className={clsx(
      'str-chat__context-menu__button',
      { 'str-chat__context-menu__button--with-submenu': hasSubMenu },
      className,
    )}
    type='button'
  >
    {Icon && <Icon className='str-chat__context-menu__button__icon' />}
    {label ? (
      <>
        <div className='str-chat__context-menu__button__label'>{label}</div>
        <div className='str-chat__context-menu__button__details'>{details}</div>
      </>
    ) : (
      <div className='str-chat__context-menu__button__label'>{children}</div>
    )}
    {!!hasSubMenu && (
      <SubmenuIcon className='str-chat__context-menu__button__submenu-icon' />
    )}
  </button>
);

export type UserContextMenuButtonProps = Pick<AvatarProps, 'imageUrl' | 'userName'> &
  ComponentProps<'button'>;

export const UserContextMenuButton = ({
  children,
  className,
  imageUrl,
  userName,
  ...props
}: UserContextMenuButtonProps) => (
  <button
    {...props}
    className={clsx(
      'str-chat__context-menu__button str-chat__user-context-menu__button',
      className,
    )}
    type='button'
  >
    <Avatar imageUrl={imageUrl} size='sm' userName={userName} />
    <div className='str-chat__context-menu__button__label'>{children ?? userName}</div>
  </button>
);

export type EmojiContextMenuButtonProps = { emoji: string } & Pick<
  BaseContextMenuButtonProps,
  'label'
> &
  ComponentProps<'button'>;

export const EmojiContextMenuButton = ({
  children,
  className,
  emoji,
  label,
  ...props
}: EmojiContextMenuButtonProps) => (
  <button
    {...props}
    className={clsx(
      'str-chat__context-menu__button str-chat__emoji-context-menu__button',
      className,
    )}
    type='button'
  >
    <span className='str-chat__context-menu__button__emoji str-chat__emoji-item--entity'>
      {emoji}
    </span>
    <div className='str-chat__context-menu__button__label'>{children ?? label}</div>
  </button>
);

type ButtonWithSubmenuProps = {
  Submenu: ComponentType;
  submenuContainerProps?: ComponentProps<'div'>;
  submenuPlacement?: PopperLikePlacement;
};

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const ContextMenuButtonWithSubmenu = ({
  children,
  className,
  Submenu,
  submenuContainerProps,
  submenuPlacement = 'right-start',
  ...buttonProps
}: BaseContextMenuButtonProps & ButtonWithSubmenuProps) => {
  const buttonRef = useRef<HTMLButtonElement | null>(null);
  const [dialogContainer, setDialogContainer] = useState<HTMLDivElement | null>(null);
  const keepSubmenuOpen = useRef(false);
  const dialogCloseTimeout = useRef<NodeJS.Timeout | null>(null);
  const dialogId = useMemo(() => `submenu-${Math.random().toString(36).slice(2)}`, []);
  const { dialog, dialogManager } = useDialogOnNearestManager({ id: dialogId });
  const dialogIsOpen = useDialogIsOpen(dialogId, dialogManager?.id);
  const { setPopperElement, styles } = useDialogAnchor<HTMLDivElement>({
    open: dialogIsOpen,
    placement: submenuPlacement,
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
      <BaseContextMenuButton
        aria-selected='false'
        className={clsx(className, 'str_chat__button-with-submenu', {
          'str_chat__button-with-submenu--submenu-open': dialogIsOpen,
        })}
        hasSubMenu
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
        role='option'
        {...buttonProps}
        ref={buttonRef}
      >
        {children}
      </BaseContextMenuButton>
      {dialogIsOpen && (
        <div
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
          style={styles}
          tabIndex={-1}
          {...submenuContainerProps}
        >
          <Submenu />
        </div>
      )}
    </>
  );
};

type ContextMenuButtonProps = BaseContextMenuButtonProps;

export const ContextMenuButton = ({
  onBlur,
  onFocus,
  ...props
}: ContextMenuButtonProps) => {
  const [isFocused, setIsFocused] = useState(false);
  return (
    <BaseContextMenuButton
      {...props}
      aria-selected={isFocused ? 'true' : 'false'}
      onBlur={(e) => {
        setIsFocused(false);
        onBlur?.(e);
      }}
      onFocus={(e) => {
        setIsFocused(true);
        onFocus?.(e);
      }}
    />
  );
};
