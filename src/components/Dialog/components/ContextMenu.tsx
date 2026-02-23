/* eslint-disable @typescript-eslint/no-unused-vars */
import clsx from 'clsx';
import React, {
  type ComponentProps,
  type ComponentType,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { Avatar, type AvatarProps } from '../../Avatar';
import { IconChevronLeft, IconChevronRight } from '../../Icons';
import type { PopperLikePlacement } from '../hooks';
import { useDialogIsOpen, useDialogOnNearestManager } from '../hooks';
import type { DialogAnchorProps } from '../service/DialogAnchor';
import { DialogAnchor, useDialogAnchor } from '../service/DialogAnchor';

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

export const ContextMenuBackButton = ({
  children,
  className,
  ...props
}: ComponentProps<'button'>) => (
  <button
    {...props}
    className={clsx('str-chat__context-menu__back-button', className)}
    type='button'
  >
    {children}
  </button>
);

export const ContextMenuHeader = ({
  children,
  className,
  ...props
}: ComponentProps<'div'>) => (
  <div {...props} className={clsx('str-chat__context-menu__header', className)}>
    {children}
  </div>
);

export const ContextMenuBody = ({
  children,
  className,
  ...props
}: ComponentProps<'div'>) => (
  <div {...props} className={clsx('str-chat__context-menu__body', className)}>
    {children}
  </div>
);

export const ContextMenuRoot = React.forwardRef<HTMLDivElement, ComponentProps<'div'>>(
  function ContextMenuRoot({ className, ...props }, ref) {
    return (
      <div {...props} className={clsx('str-chat__context-menu', className)} ref={ref} />
    );
  },
);

export type ContextMenuHeaderComponent = ComponentType;
export type ContextMenuSubmenu = ComponentType;

export type ContextMenuOpenSubmenuParams = {
  Submenu: ContextMenuSubmenu;
  Header?: ContextMenuHeaderComponent;
  ItemsWrapper?: ComponentType<ComponentProps<'div'>>;
  menuClassName?: string;
};

export type ContextMenuItemProps = ComponentProps<'button'> & {
  closeMenu: () => void;
  openSubmenu: (params: ContextMenuOpenSubmenuParams) => void;
};

export type ContextMenuItemComponent = ComponentType<ContextMenuItemProps>;

type ContextMenuContextValue = {
  closeMenu: () => void;
  openSubmenu: (params: ContextMenuOpenSubmenuParams) => void;
  returnToParentMenu: () => void;
};

const ContextMenuContext = React.createContext<ContextMenuContextValue | null>(null);

export const useContextMenuContext = () => {
  const context = useContext(ContextMenuContext);
  if (!context) {
    throw new Error(
      'Context consumer hook useContextMenuContext must be used within ContextMenuContext',
    );
  }
  return context;
};

type ContextMenuLevel = {
  items?: ContextMenuItemComponent[];
  Submenu?: ContextMenuSubmenu;
  Header?: ContextMenuHeaderComponent;
  ItemsWrapper?: ComponentType<ComponentProps<'div'>>;
  menuClassName?: string;
};

type ContextMenuBaseProps = Omit<ComponentProps<'div'>, 'children'> & {
  backLabel?: ReactNode;
  items: ContextMenuItemComponent[];
  Header?: ContextMenuHeaderComponent;
  ItemsWrapper?: ComponentType<ComponentProps<'div'>>;
  menuClassName?: string;
  onClose?: () => void;
  onMenuLevelChange?: (level: number) => void;
};

/** When provided, ContextMenu renders inside DialogAnchor and wires menu level for submenu alignment. */
type ContextMenuAnchorProps = Partial<
  Pick<
    DialogAnchorProps,
    | 'id'
    | 'dialogManagerId'
    | 'placement'
    | 'referenceElement'
    | 'tabIndex'
    | 'trapFocus'
    | 'allowFlip'
    | 'focus'
  >
>;

export type ContextMenuProps = ContextMenuBaseProps & ContextMenuAnchorProps;

function ContextMenuContent({
  backLabel = 'Back',
  className,
  Header,
  items,
  ItemsWrapper,
  menuClassName,
  onClose,
  onMenuLevelChange,
  ...props
}: ContextMenuBaseProps) {
  const rootLevel = useMemo<ContextMenuLevel>(
    () => ({
      Header,
      items,
      ItemsWrapper,
      menuClassName,
    }),
    [Header, items, ItemsWrapper, menuClassName],
  );
  const [menuStack, setMenuStack] = useState<ContextMenuLevel[]>(() => [rootLevel]);
  const activeMenu = menuStack[menuStack.length - 1];

  const closeMenu = useCallback(() => {
    onClose?.();
  }, [onClose]);

  const openSubmenu = useCallback(
    ({
      Header,
      ItemsWrapper: SubmenuItemsWrapper,
      menuClassName,
      Submenu,
    }: ContextMenuOpenSubmenuParams) => {
      const nextLevel: ContextMenuLevel = {
        Header,
        ItemsWrapper: SubmenuItemsWrapper ?? ItemsWrapper,
        menuClassName,
        Submenu,
      };
      setMenuStack((current) => [...current, nextLevel]);
    },
    [ItemsWrapper],
  );

  const returnToParentMenu = useCallback(() => {
    setMenuStack((current) =>
      current.length > 1 ? current.slice(0, current.length - 1) : current,
    );
  }, []);

  useEffect(() => {
    setMenuStack((current) => {
      if (current.length === 1 && current[0] === rootLevel) return current;
      return [rootLevel];
    });
  }, [rootLevel]);

  useEffect(() => {
    onMenuLevelChange?.(menuStack.length);
  }, [menuStack.length, onMenuLevelChange]);

  return (
    <ContextMenuContext.Provider value={{ closeMenu, openSubmenu, returnToParentMenu }}>
      <ContextMenuRoot className={clsx(className, activeMenu.menuClassName)} {...props}>
        {activeMenu.Header ? (
          <activeMenu.Header />
        ) : menuStack.length > 1 ? (
          <ContextMenuHeader>
            <ContextMenuBackButton onClick={returnToParentMenu}>
              <IconChevronLeft />
              <span>{backLabel}</span>
            </ContextMenuBackButton>
          </ContextMenuHeader>
        ) : null}
        <ContextMenuBody>
          {activeMenu.Submenu ? (
            <activeMenu.Submenu />
          ) : activeMenu.ItemsWrapper ? (
            <activeMenu.ItemsWrapper>
              {activeMenu.items?.map((Item, index) => (
                <Item
                  closeMenu={closeMenu}
                  key={`context-menu-item-${index}`}
                  openSubmenu={openSubmenu}
                />
              ))}
            </activeMenu.ItemsWrapper>
          ) : (
            activeMenu.items?.map((Item, index) => (
              <Item
                closeMenu={closeMenu}
                key={`context-menu-item-${index}`}
                openSubmenu={openSubmenu}
              />
            ))
          )}
        </ContextMenuBody>
      </ContextMenuRoot>
    </ContextMenuContext.Provider>
  );
}

export const ContextMenu = (props: ContextMenuProps) => {
  const {
    allowFlip,
    dialogManagerId,
    focus,
    id,
    placement,
    referenceElement,
    tabIndex,
    trapFocus,
    ...menuProps
  } = props;

  const isAnchored = id != null;

  const [menuLevel, setMenuLevel] = useState(1);
  const open = useDialogIsOpen(id ?? '', dialogManagerId);

  useEffect(() => {
    if (isAnchored && !open) setMenuLevel(1);
  }, [isAnchored, open]);

  const content = (
    <ContextMenuContent
      {...menuProps}
      onMenuLevelChange={isAnchored ? setMenuLevel : menuProps.onMenuLevelChange}
    />
  );

  if (isAnchored) {
    const {
      backLabel: _b,
      Header: _h,
      items: _i,
      ItemsWrapper: _w,
      menuClassName: _m,
      onClose: _c,
      onMenuLevelChange: _l,
      ...anchorDivProps
    } = menuProps;
    return (
      <DialogAnchor
        allowFlip={allowFlip}
        dialogManagerId={dialogManagerId}
        focus={focus}
        id={id}
        placement={placement}
        referenceElement={referenceElement}
        tabIndex={tabIndex}
        trapFocus={trapFocus}
        updateKey={menuLevel}
        {...anchorDivProps}
      >
        {content}
      </DialogAnchor>
    );
  }

  return content;
};
