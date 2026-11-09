import clsx from 'clsx';
import React, {
  type ComponentProps,
  type ComponentPropsWithoutRef,
  type ComponentType,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { type AvatarProps, Avatar as DefaultAvatar } from '../../Avatar';
import type { PopperLikePlacement } from '../hooks';
import { useDialogIsOpen, useDialogOnNearestManager } from '../hooks';
import type { DialogAnchorProps } from '../service/DialogAnchor';
import { DialogAnchor, useDialogAnchor } from '../service/DialogAnchor';
import {
  useComponentContext,
  useComponentContextIcons,
  useTranslationContext,
} from '../../../context';
import { createRovingFocusKeyDownHandler } from '../../../a11y/a11yUtils';
import { VisuallyHidden } from '../../VisuallyHidden';
import { useStableId } from '../../UtilityComponents/useStableId';
import { requireContext } from '../../../context/requireContext';

// Submenus are a stack of levels, reset to the root when an anchored menu closes. Forward and
// backward animation classes apply only to submenu transitions in anchored mode, and the body is
// remounted on each level change so the CSS enter animation restarts. `closeTransitionMs` defaults
// to 130 (0 in `DialogAnchor`) so the closing keyframes in `ContextMenu.scss` can play. A submenu
// button closes its popover after a short delay unless pointer or focus is still inside, so moving
// between the button and its submenu does not dismiss it.

export type BaseContextMenuButtonProps = {
  details?: ReactNode;
  hasSubMenu?: boolean;
  label?: ReactNode;
  Icon?: ComponentType<ComponentProps<'svg'>>;
  SubmenuIcon?: ComponentType<ComponentProps<'svg'>>;
  variant?: 'destructive';
} & ComponentProps<'button'>;

export const BaseContextMenuButton = ({
  children,
  className,
  details,
  hasSubMenu,
  Icon,
  label,
  role = 'menuitem',
  SubmenuIcon,
  variant,
  ...props
}: BaseContextMenuButtonProps) => {
  const { IconChevronRight } = useComponentContextIcons();
  const ResolvedSubmenuIcon = SubmenuIcon ?? IconChevronRight;

  return (
    <button
      {...props}
      className={clsx(
        'str-chat__context-menu__button',
        {
          'str-chat__context-menu__button--with-submenu': hasSubMenu,
          [`str-chat__context-menu__button--${variant}`]: typeof variant === 'string',
        },
        className,
      )}
      role={role}
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
        <ResolvedSubmenuIcon className='str-chat__context-menu__button__submenu-icon' />
      )}
    </button>
  );
};

export type UserContextMenuButtonProps = Pick<AvatarProps, 'imageUrl' | 'userName'> &
  ComponentProps<'button'>;

export const UserContextMenuButton = ({
  children,
  className,
  imageUrl,
  role = 'menuitem',
  userName,
  ...props
}: UserContextMenuButtonProps) => {
  const { Avatar = DefaultAvatar } = useComponentContext();
  return (
    <button
      {...props}
      className={clsx(
        'str-chat__context-menu__button str-chat__user-context-menu__button',
        className,
      )}
      role={role}
      type='button'
    >
      {/* The label already names the user, so the avatar is hidden from assistive tech. */}
      <Avatar aria-hidden imageUrl={imageUrl} size='sm' userName={userName} />
      <div className='str-chat__context-menu__button__label'>{children ?? userName}</div>
    </button>
  );
};

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
  role = 'menuitem',
  ...props
}: EmojiContextMenuButtonProps) => (
  <button
    {...props}
    className={clsx(
      'str-chat__context-menu__button str-chat__emoji-context-menu__button',
      className,
    )}
    role={role}
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
  submenuRollAxis?: 'x' | 'y';
};

const ContextMenuButtonWithSubmenu = ({
  children,
  className,
  Submenu,
  submenuContainerProps,
  submenuPlacement = 'right-start',
  submenuRollAxis = 'x',
  ...buttonProps
}: BaseContextMenuButtonProps & ButtonWithSubmenuProps) => {
  const { className: submenuClassName, ...submenuContainerRestProps } =
    submenuContainerProps ?? {};
  const { registerDialogSubmenu, unregisterDialogSubmenu } = useContextMenuContext();
  const buttonRef = useRef<HTMLButtonElement | null>(null);
  const [dialogContainer, setDialogContainer] = useState<HTMLDivElement | null>(null);
  const keepSubmenuOpenFlag = useRef(false);
  const dialogCloseTimeout = useRef<NodeJS.Timeout | null>(null);
  const dialogId = useMemo(() => `submenu-${Math.random().toString(36).slice(2)}`, []);
  const { dialog, dialogManager } = useDialogOnNearestManager({ id: dialogId });
  const dialogIsOpen = useDialogIsOpen(dialogId, dialogManager?.id);

  useEffect(() => {
    if (!dialogIsOpen) return;
    registerDialogSubmenu();
    return () => unregisterDialogSubmenu();
  }, [dialogIsOpen, registerDialogSubmenu, unregisterDialogSubmenu]);
  const {
    placement: chosenPlacement,
    setPopperElement,
    styles,
  } = useDialogAnchor<HTMLDivElement>({
    offset: 8,
    open: dialogIsOpen,
    placement: submenuPlacement,
    referenceElement: buttonRef.current,
  });

  const closeDialogLazily = useCallback(() => {
    if (dialogCloseTimeout.current) clearTimeout(dialogCloseTimeout.current);
    dialogCloseTimeout.current = setTimeout(() => {
      if (keepSubmenuOpenFlag.current) return;
      dialog.close();
    }, 100);
  }, [dialog]);

  const keepSubmenuOpen = useCallback(() => {
    keepSubmenuOpenFlag.current = true;
  }, []);

  const allowToCloseSubmenu = useCallback(() => {
    keepSubmenuOpenFlag.current = false;
  }, []);

  const closeSubmenu = useCallback(() => {
    allowToCloseSubmenu();
    closeDialogLazily();
  }, [allowToCloseSubmenu, closeDialogLazily]);

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
    keepSubmenuOpen();
  };

  useEffect(() => {
    const parentButton = buttonRef.current;
    if (!dialogIsOpen || !parentButton) return;
    const hideOnEscape = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      handleClose(event);
      closeSubmenu();
    };

    document.addEventListener('keyup', hideOnEscape, { capture: true });

    return () => {
      document.removeEventListener('keyup', hideOnEscape, { capture: true });
    };
  }, [dialogIsOpen, handleClose, closeSubmenu]);

  return (
    <>
      <BaseContextMenuButton
        aria-expanded={dialogIsOpen}
        aria-haspopup='menu'
        className={clsx(className, 'str_chat__button-with-submenu', {
          'str_chat__button-with-submenu--submenu-open': dialogIsOpen,
        })}
        hasSubMenu
        onBlur={closeSubmenu}
        onClick={(event) => {
          event.stopPropagation();
          dialog.toggle();
        }}
        onFocus={handleFocusParentButton}
        onMouseEnter={handleFocusParentButton}
        onMouseLeave={closeSubmenu}
        {...buttonProps}
        ref={buttonRef}
      >
        {children}
      </BaseContextMenuButton>
      {dialogIsOpen && (
        <div
          className={clsx('str-chat__context-menu__submenu-container', submenuClassName)}
          data-str-chat-placement={chosenPlacement}
          data-str-chat-roll-axis={submenuRollAxis}
          onBlur={(event) => {
            const isBlurredDescendant =
              event.relatedTarget instanceof Node &&
              dialogContainer?.contains(event.relatedTarget);
            if (isBlurredDescendant) return;
            closeSubmenu();
          }}
          onFocus={keepSubmenuOpen}
          onMouseEnter={keepSubmenuOpen}
          onMouseLeave={closeSubmenu}
          ref={(element) => {
            setPopperElement(element);
            setDialogContainer(element);
          }}
          style={styles}
          tabIndex={-1}
          {...submenuContainerRestProps}
        >
          <Submenu />
        </div>
      )}
    </>
  );
};

type ContextMenuButtonProps = BaseContextMenuButtonProps &
  Partial<ButtonWithSubmenuProps>;

export const ContextMenuButton = (props: ContextMenuButtonProps) => {
  const {
    Submenu,
    submenuContainerProps,
    submenuPlacement,
    submenuRollAxis,
    ...buttonProps
  } = props;
  if (Submenu) {
    return (
      <ContextMenuButtonWithSubmenu
        {...buttonProps}
        Submenu={Submenu}
        submenuContainerProps={submenuContainerProps}
        submenuPlacement={submenuPlacement}
        submenuRollAxis={submenuRollAxis}
      />
    );
  }

  return <BaseContextMenuButton {...buttonProps} />;
};

export const ContextMenuBackButton = ({
  'aria-label': ariaLabel,
  'aria-labelledby': ariaLabelledBy,
  children,
  className,
  role = 'menuitem',
  ...props
}: ComponentProps<'button'>) => {
  const { t } = useTranslationContext();
  const generatedBackNavigationLabelId = useStableId();
  const generatedVisibleLabelId = useStableId();
  const resolvedAriaLabel =
    ariaLabel ??
    t('dialog.contextMenu.backParentMenuButton.ariaLabel', 'Back to parent menu button');
  const resolvedAriaLabelledBy =
    ariaLabelledBy ?? `${generatedVisibleLabelId} ${generatedBackNavigationLabelId}`;

  return (
    <button
      {...props}
      aria-labelledby={resolvedAriaLabelledBy}
      className={clsx('str-chat__context-menu__back-button', className)}
      role={role}
      type='button'
    >
      {!ariaLabelledBy && (
        <VisuallyHidden id={generatedBackNavigationLabelId}>
          {resolvedAriaLabel}
        </VisuallyHidden>
      )}
      <span
        className='str-chat__context-menu__back-button__content'
        id={generatedVisibleLabelId}
      >
        {children}
      </span>
    </button>
  );
};

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
  function ContextMenuRoot({ className, role = 'menu', ...props }, ref) {
    return (
      <div
        {...props}
        className={clsx('str-chat__context-menu', className)}
        ref={ref}
        role={role}
      />
    );
  },
);

export type ContextMenuHeaderComponent = ComponentType;
export type ContextMenuSubmenu = ComponentType;

export type ContextMenuOpenSubmenuParams = Omit<
  ContextMenuLevel,
  'focusRestoreRequest' | 'items'
> & {
  focusReturnTarget?: HTMLElement | null;
};

export type ContextMenuItemProps = ComponentProps<'button'>;

export type ContextMenuItemComponent = ComponentType<ContextMenuItemProps>;

export const DEFAULT_CONTEXT_MENU_KEYBOARD_NAVIGATION_ITEM_SELECTOR = [
  '[role="menuitem"]:not(:disabled)',
  '[role="menuitemradio"]:not(:disabled)',
  '[role="menuitemcheckbox"]:not(:disabled)',
].join(',');

const isVisibleContextMenuKeyboardNavigationItem = (item: HTMLElement) => {
  // offsetParent is null for display:none elements; offsetHeight covers position:fixed ones.
  if (item.offsetParent !== null || item.offsetHeight > 0) return true;

  // Without layout (e.g. jsdom) both are always null/0, so fall back to `hidden` and inline style.
  if (item.hidden) return false;
  const display = item.style.display;
  if (display === 'none') return false;

  return true;
};

type ContextMenuFocusRestoreRequest = {
  /** Positional fallback used when the target element is no longer in the DOM. */
  index: number;
  target: HTMLElement | null;
};

const getVisibleContextMenuKeyboardNavigationItems = (
  contextMenuRoot: Element | null,
  itemSelector: string = DEFAULT_CONTEXT_MENU_KEYBOARD_NAVIGATION_ITEM_SELECTOR,
) =>
  Array.from(contextMenuRoot?.querySelectorAll<HTMLElement>(itemSelector) ?? []).filter(
    isVisibleContextMenuKeyboardNavigationItem,
  );

const createContextMenuFocusRestoreRequest = ({
  contextMenuRoot,
  focusReturnTarget,
}: {
  contextMenuRoot: Element | null;
  focusReturnTarget?: HTMLElement | null;
}): ContextMenuFocusRestoreRequest => {
  const target =
    focusReturnTarget ??
    (document.activeElement instanceof HTMLElement ? document.activeElement : null);

  if (!target) return { index: -1, target: null };

  const index = getVisibleContextMenuKeyboardNavigationItems(contextMenuRoot).findIndex(
    (menuItem) => menuItem === target,
  );

  return { index, target };
};

const resolveContextMenuFocusRestoreTarget = ({
  contextMenuRoot,
  request,
}: {
  contextMenuRoot: Element | null;
  request: ContextMenuFocusRestoreRequest | null;
}) => {
  if (!request) return null;

  if (request.target?.isConnected) return request.target;

  if (request.index >= 0) {
    return (
      getVisibleContextMenuKeyboardNavigationItems(contextMenuRoot)[request.index] ?? null
    );
  }

  return null;
};

const CONTEXT_MENU_HEADER_SELECTOR = '.str-chat__context-menu__header';

/**
 * Where focus lands when a submenu opens: the first item outside the header (`'first-item'`,
 * falling back to the first item overall), the first item overall (`'first'`), or nowhere
 * (`'none'`).
 */
export type ContextMenuSubmenuInitialFocus = 'first' | 'first-item' | 'none';

const resolveSubmenuInitialFocusTarget = ({
  contextMenuRoot,
  initialFocus,
  itemSelector,
}: {
  contextMenuRoot: Element | null;
  initialFocus: ContextMenuSubmenuInitialFocus;
  itemSelector?: string;
}): HTMLElement | null => {
  if (initialFocus === 'none') return null;

  const items = getVisibleContextMenuKeyboardNavigationItems(
    contextMenuRoot,
    itemSelector,
  );
  if (initialFocus === 'first') return items[0] ?? null;

  return (
    items.find((item) => !item.closest(CONTEXT_MENU_HEADER_SELECTOR)) ?? items[0] ?? null
  );
};

export type ContextMenuKeyboardNavigation = {
  /**
   * CSS selector for the items keyboard navigation and initial focus move across. Defaults to
   * non-disabled `menuitem`, `menuitemradio` and `menuitemcheckbox` elements.
   */
  itemSelector?: string;
};

type ContextMenuContextValue = {
  anchorReferenceElement?: HTMLElement | null;
  closeMenu: () => void;
  openSubmenu: (params: ContextMenuOpenSubmenuParams) => void;
  registerDialogSubmenu: () => void;
  returnToParentMenu: () => void;
  unregisterDialogSubmenu: () => void;
};

const ContextMenuContext = React.createContext<ContextMenuContextValue | undefined>(
  undefined,
);

export const useContextMenuContext = () =>
  requireContext(useContext(ContextMenuContext), 'useContextMenuContext', 'ContextMenu');

type ContextMenuLevel = {
  focusRestoreRequest?: ContextMenuFocusRestoreRequest;
  /**
   * Where focus lands when this level opens as a submenu. Defaults to `'first-item'`. Ignored for
   * the root level, whose focus comes from the dialog's `focus` prop.
   */
  initialFocus?: ContextMenuSubmenuInitialFocus;
  items?: ContextMenuItemComponent[];
  Submenu?: ContextMenuSubmenu;
  Header?: ContextMenuHeaderComponent;
  ItemsWrapper?: ComponentType;
  menuClassName?: string;
};

type ContextMenuBaseProps = ComponentPropsWithoutRef<'div'> & {
  backButtonAriaLabel?: string;
  backLabel?: ReactNode;
  enableAnimations?: boolean;
  Header?: ContextMenuHeaderComponent;
  /** Overrides the item selector used by the always-enabled arrow, Home and End navigation. */
  keyboardNavigation?: ContextMenuKeyboardNavigation;
  onClose?: () => void;
  onMenuLevelChange?: (level: number) => void;
  /** How long (ms) the forward/backward transition direction stays set. Defaults to 460. */
  submenuTransitionDurationMs?: number;
} & ContextMenuLevel;

/** Passing `id` renders the menu inside `DialogAnchor` (anchored mode). */
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
    | 'closeOnClickOutside'
    | 'focus'
    | 'closeTransitionMs'
    | 'offset'
  >
>;

export type ContextMenuProps = ContextMenuBaseProps & ContextMenuAnchorProps;

export type ContextMenuContentProps = ContextMenuBaseProps & {
  anchorReferenceElement?: HTMLElement | null;
  transitionDirection?: 'forward' | 'backward';
};

/** Default content of {@link ContextMenu}; replace it via `ComponentContext.ContextMenuContent`. */
export function ContextMenuContent({
  anchorReferenceElement,
  backButtonAriaLabel,
  backLabel,
  children,
  className,
  enableAnimations = true,
  Header,
  items,
  ItemsWrapper,
  keyboardNavigation,
  menuClassName,
  onClose,
  onMenuLevelChange,
  transitionDirection,
  ...props
}: ContextMenuContentProps) {
  const { t } = useTranslationContext();
  const { IconChevronLeft } = useComponentContextIcons();
  const resolvedBackLabel = backLabel ?? t('common.back.label', 'Back');
  const {
    ['aria-describedby']: rootAriaDescribedBy,
    ['aria-label']: rootAriaLabel,
    ['aria-labelledby']: rootAriaLabelledBy,
    ...contextMenuRootProps
  } = props;
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
  const [menuBodyAnimationKey, setMenuBodyAnimationKey] = useState(0);
  const contextMenuRootRef = useRef<HTMLDivElement | null>(null);
  const focusRestoreRequestRef = useRef<ContextMenuFocusRestoreRequest | null>(null);
  // Focus target for the next level to open; the counterpart of `focusRestoreRequestRef`.
  const pendingForwardFocusRef = useRef<ContextMenuSubmenuInitialFocus | null>(null);
  const activeMenu = menuStack[menuStack.length - 1];

  const keyboardNavigationItemSelector =
    keyboardNavigation?.itemSelector ??
    DEFAULT_CONTEXT_MENU_KEYBOARD_NAVIGATION_ITEM_SELECTOR;

  const ActiveMenuItemsWrapper = activeMenu.ItemsWrapper ?? React.Fragment;

  const closeMenu = useCallback(() => {
    onClose?.();
  }, [onClose]);

  const openSubmenu = useCallback(
    ({
      focusReturnTarget,
      Header,
      initialFocus = 'first-item',
      ItemsWrapper: SubmenuItemsWrapper,
      menuClassName,
      Submenu,
    }: ContextMenuOpenSubmenuParams) => {
      // The level-change effect moves focus once the new level renders; clear any backward
      // request so only the forward one applies.
      pendingForwardFocusRef.current = initialFocus;
      focusRestoreRequestRef.current = null;
      const nextLevel: ContextMenuLevel = {
        focusRestoreRequest: createContextMenuFocusRestoreRequest({
          contextMenuRoot: contextMenuRootRef.current,
          focusReturnTarget,
        }),
        Header,
        initialFocus,
        ItemsWrapper: SubmenuItemsWrapper ?? ItemsWrapper,
        menuClassName,
        Submenu,
      };
      setMenuStack((current) => [...current, nextLevel]);
    },
    [ItemsWrapper],
  );

  const returnToParentMenu = useCallback(() => {
    setMenuStack((current) => {
      if (current.length <= 1) return current;
      focusRestoreRequestRef.current =
        current[current.length - 1]?.focusRestoreRequest ?? null;
      // Clear any forward request so only the backward restore applies.
      pendingForwardFocusRef.current = null;
      return current.slice(0, -1);
    });
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

  // Layout effect that re-runs on body remount (`menuBodyAnimationKey`): the remount restarts the
  // enter animation and drops the just-focused node. The request refs are not consumed here.
  useLayoutEffect(() => {
    const focusRestoreRequest = focusRestoreRequestRef.current;
    const pendingForwardFocus = pendingForwardFocusRef.current;
    if (!focusRestoreRequest && !pendingForwardFocus) return;

    const contextMenuRoot = contextMenuRootRef.current;
    // A backward restore takes precedence over a forward request.
    const target = focusRestoreRequest
      ? resolveContextMenuFocusRestoreTarget({
          contextMenuRoot,
          request: focusRestoreRequest,
        })
      : // Forward: the parent item that had focus unmounts, so focus moves into the new level.
        resolveSubmenuInitialFocusTarget({
          contextMenuRoot,
          initialFocus: pendingForwardFocus as ContextMenuSubmenuInitialFocus,
          itemSelector: keyboardNavigationItemSelector,
        });

    target?.focus();
  }, [keyboardNavigationItemSelector, menuBodyAnimationKey, menuStack.length]);

  useEffect(() => {
    if (!transitionDirection) return;
    setMenuBodyAnimationKey((value) => value + 1);
  }, [transitionDirection, menuStack.length]);

  const dialogSubmenuOpenCountRef = useRef(0);

  const registerDialogSubmenu = useCallback(() => {
    dialogSubmenuOpenCountRef.current += 1;
  }, []);

  const unregisterDialogSubmenu = useCallback(() => {
    dialogSubmenuOpenCountRef.current = Math.max(
      0,
      dialogSubmenuOpenCountRef.current - 1,
    );
  }, []);

  const rovingFocusKeyDownHandler = useMemo(
    () =>
      createRovingFocusKeyDownHandler<HTMLElement>({
        getItems: (event) =>
          getVisibleContextMenuKeyboardNavigationItems(
            event.currentTarget,
            keyboardNavigationItemSelector,
          ),
      }),
    [keyboardNavigationItemSelector],
  );

  const escapeConsumedRef = useRef(false);

  const keyboardNavigationHandler = useCallback(
    (event: React.KeyboardEvent<HTMLElement>) => {
      if (event.key === 'Escape') {
        if (dialogSubmenuOpenCountRef.current > 0) return;

        event.preventDefault();
        event.stopPropagation();

        if (menuStack.length > 1) {
          escapeConsumedRef.current = true;
          returnToParentMenu();
        } else {
          closeMenu();
        }
        return;
      }

      rovingFocusKeyDownHandler(event);
    },
    [closeMenu, menuStack.length, returnToParentMenu, rovingFocusKeyDownHandler],
  );

  const suppressEscapeKeyUp = useCallback((event: React.KeyboardEvent<HTMLElement>) => {
    if (event.key === 'Escape' && escapeConsumedRef.current) {
      escapeConsumedRef.current = false;
      event.stopPropagation();
    }
  }, []);
  const isSubmenuLevel = menuStack.length > 1;

  return (
    <ContextMenuContext.Provider
      value={{
        anchorReferenceElement,
        closeMenu,
        openSubmenu,
        registerDialogSubmenu,
        returnToParentMenu,
        unregisterDialogSubmenu,
      }}
    >
      <ContextMenuRoot
        aria-describedby={isSubmenuLevel ? undefined : rootAriaDescribedBy}
        aria-label={
          isSubmenuLevel
            ? t('dialog.contextMenu.submenu.ariaLabel', 'Submenu')
            : rootAriaLabel
        }
        aria-labelledby={isSubmenuLevel ? undefined : rootAriaLabelledBy}
        className={clsx(className, activeMenu.menuClassName)}
        data-str-chat-enable-animations={enableAnimations}
        onKeyDownCapture={keyboardNavigationHandler}
        onKeyUpCapture={suppressEscapeKeyUp}
        ref={contextMenuRootRef}
        {...contextMenuRootProps}
      >
        {activeMenu.Header ? (
          <activeMenu.Header />
        ) : menuStack.length > 1 ? (
          <ContextMenuHeader>
            <ContextMenuBackButton
              aria-label={backButtonAriaLabel}
              onClick={returnToParentMenu}
            >
              <IconChevronLeft />
              <span>{resolvedBackLabel}</span>
            </ContextMenuBackButton>
          </ContextMenuHeader>
        ) : null}
        <ContextMenuBody
          className={clsx({
            'str-chat__context-menu__body--submenu-backward':
              transitionDirection === 'backward',
            'str-chat__context-menu__body--submenu-forward':
              transitionDirection === 'forward',
          })}
          key={`context-menu-body-${menuStack.length}-${menuBodyAnimationKey}`}
        >
          {activeMenu.Submenu ? (
            <activeMenu.Submenu />
          ) : (
            <ActiveMenuItemsWrapper>
              {typeof children !== 'undefined'
                ? children
                : activeMenu.items?.map((Item, index) => (
                    <Item key={`context-menu-item-${index}`} />
                  ))}
            </ActiveMenuItemsWrapper>
          )}
        </ContextMenuBody>
      </ContextMenuRoot>
    </ContextMenuContext.Provider>
  );
}

/**
 * Contextual actions menu: anchored to `referenceElement` in a `DialogAnchor` when `id` is set,
 * a plain inline list otherwise.
 *
 * Replace the whole menu with `ComponentContext.ContextMenu`, or only its content with
 * `ComponentContext.ContextMenuContent`. To change outside-click dismissal, wrap the default:
 *
 * ```tsx
 * const CustomContextMenu = (props: ContextMenuProps) => (
 *   <ContextMenu {...props} closeOnClickOutside={false} />
 * );
 * <ComponentProvider value={{ ContextMenu: CustomContextMenu }}>{children}</ComponentProvider>
 * ```
 */
export const ContextMenu = (props: ContextMenuProps) => {
  const { ContextMenuContent: ContextMenuContentComponent = ContextMenuContent } =
    useComponentContext();
  const {
    allowFlip,
    closeOnClickOutside,
    closeTransitionMs = 130,
    dialogManagerId,
    focus,
    id,
    offset = 8,
    onMenuLevelChange: onMenuLevelChangeProp,
    placement,
    referenceElement,
    submenuTransitionDurationMs,
    tabIndex,
    trapFocus,
    ...menuProps
  } = props;
  const resolvedSubmenuTransitionDurationMs = submenuTransitionDurationMs ?? 460;

  const isAnchored = id != null;

  const [menuLevel, setMenuLevel] = useState(1);
  const [transitionDirection, setTransitionDirection] = useState<
    'forward' | 'backward' | undefined
  >(undefined);
  const [contentResetToken, setContentResetToken] = useState(0);
  const transitionTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const previousMenuLevelRef = useRef(1);
  const open = useDialogIsOpen(id ?? '', dialogManagerId);
  const previousOpenRef = useRef(open);

  useEffect(() => {
    if (!isAnchored) return;

    if (previousOpenRef.current && !open) {
      setMenuLevel(1);
      setTransitionDirection(undefined);
      setContentResetToken((value) => value + 1);
      previousMenuLevelRef.current = 1;
      if (transitionTimeoutRef.current) {
        clearTimeout(transitionTimeoutRef.current);
        transitionTimeoutRef.current = null;
      }
    }
    previousOpenRef.current = open;
  }, [isAnchored, open]);

  useEffect(
    () => () => {
      if (transitionTimeoutRef.current) {
        clearTimeout(transitionTimeoutRef.current);
      }
    },
    [],
  );

  const handleMenuLevelChange = useCallback(
    (level: number) => {
      if (isAnchored) {
        const previousLevel = previousMenuLevelRef.current;
        if (level !== previousLevel) {
          setTransitionDirection(level > previousLevel ? 'forward' : 'backward');
          if (transitionTimeoutRef.current) clearTimeout(transitionTimeoutRef.current);
          transitionTimeoutRef.current = setTimeout(() => {
            setTransitionDirection(undefined);
            transitionTimeoutRef.current = null;
          }, resolvedSubmenuTransitionDurationMs);
        }
        previousMenuLevelRef.current = level;
        setMenuLevel(level);
        return;
      }
      onMenuLevelChangeProp?.(level);
    },
    [isAnchored, onMenuLevelChangeProp, resolvedSubmenuTransitionDurationMs],
  );

  const content = (
    <ContextMenuContentComponent
      anchorReferenceElement={isAnchored ? referenceElement : undefined}
      {...menuProps}
      key={`context-menu-content-${contentResetToken}`}
      onMenuLevelChange={handleMenuLevelChange}
      transitionDirection={transitionDirection}
    />
  );

  if (isAnchored) {
    const {
      ['aria-describedby']: ariaDescribedBy,
      ['aria-label']: ariaLabel,
      ['aria-labelledby']: ariaLabelledBy,
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      backButtonAriaLabel: _bbal,
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      backLabel: _b,
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      enableAnimations: _ea,
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      Header: _h,
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      items: _i,
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      ItemsWrapper: _w,
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      keyboardNavigation: _kn,
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      menuClassName: _m,
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      onClose: _c,
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      role: _r,
      ...anchorDivProps
    } = menuProps;
    const isSubmenuLevel = menuLevel > 1;
    return (
      <DialogAnchor
        allowFlip={allowFlip}
        aria-describedby={isSubmenuLevel ? undefined : ariaDescribedBy}
        aria-label={isSubmenuLevel ? undefined : ariaLabel}
        aria-labelledby={isSubmenuLevel ? undefined : ariaLabelledBy}
        closeOnClickOutside={closeOnClickOutside}
        closeTransitionMs={closeTransitionMs}
        dialogManagerId={dialogManagerId}
        focus={focus}
        id={id}
        offset={offset}
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
