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
import { Avatar, type AvatarProps } from '../../Avatar';
import { IconChevronLeft, IconChevronRight } from '../../Icons';
import type { PopperLikePlacement } from '../hooks';
import { useDialogIsOpen, useDialogOnNearestManager } from '../hooks';
import type { DialogAnchorProps } from '../service/DialogAnchor';
import { DialogAnchor, useDialogAnchor } from '../service/DialogAnchor';
import { useComponentContext, useTranslationContext } from '../../../context';
import { createRovingFocusKeyDownHandler } from '../../../a11y/a11yUtils';
import { VisuallyHidden } from '../../VisuallyHidden';
import { useStableId } from '../../UtilityComponents/useStableId';

/**
 * ContextMenu module
 *
 * What this file provides
 * - Primitives for contextual action UIs:
 *   `ContextMenu`, `ContextMenuContent`, `ContextMenuButton`, `ContextMenuHeader`,
 *   `ContextMenuBody`, `ContextMenuBackButton`, and user/emoji button variants.
 * - A small runtime context (`useContextMenuContext`) used by menu items to:
 *   - close the current menu (`closeMenu`)
 *   - open a submenu (`openSubmenu`)
 *   - return to parent level (`returnToParentMenu`)
 *
 * Rendering modes
 * - Anchored mode (most common): pass `id` and `referenceElement`.
 *   The component renders inside `DialogAnchor` and uses dialog manager state.
 * - Inline mode: omit anchor props and render as a plain contextual list.
 * - Outside click dismissal can be overridden per menu via `closeOnClickOutside`;
 *   otherwise manager default is used.
 *
 * Submenu model
 * - Submenus are represented as a stack of menu levels.
 * - Each level can define `Header`, `Submenu`, `items`, `ItemsWrapper`,
 *   and `menuClassName`.
 * - Opening submenu pushes a level to the stack; going back pops one level.
 * - When anchored menu closes, stack resets to root to avoid stale submenu state
 *   on next open.
 *
 * Animation model
 * - Root menu open/close is handled by `DialogAnchor` transition timing.
 * - `ContextMenu` defaults `closeTransitionMs` to `130` so close animations can be visible.
 * - `DialogAnchor` marks rendered content with `data-str-chat-dialog-state`:
 *   - `open` while visible
 *   - `closing` during delayed unmount window (`closeTransitionMs`)
 * - Context-menu closing keyframes in `ContextMenu.scss` target
 *   `[data-str-chat-dialog-state='closing']` + placement selectors.
 * - Level-to-level transitions are directional:
 *   - forward: parent -> submenu
 *   - backward: submenu -> parent
 * - Direction is tracked in `ContextMenu` and passed to `ContextMenuContent`.
 * - `ContextMenuContent` bumps an internal key for `ContextMenuBody` so React
 *   remounts the body and CSS enter animation reliably restarts on each level change.
 * - Initial/root menu render does not apply submenu forward/backward classes;
 *   directional animation classes are used only for submenu transitions.
 * - `enableAnimations` can disable content animations through data attributes/CSS.
 * - `submenuTransitionDurationMs` controls how long directional transition state is kept.
 *
 * Submenu popover behavior (`ContextMenuButton` with `Submenu`)
 * - Submenu can be rendered by passing `Submenu` (and optional placement/container props).
 * - Default submenu roll axis is `x` (override with `submenuRollAxis`).
 * - Hover/focus management uses a "keep open" ref flag plus lazy close timeout to avoid
 *   accidental submenu dismissal when moving pointer/focus between parent and submenu.
 *
 * Customization via `ComponentContext`
 * - `ComponentContext.ContextMenu` replaces the whole menu component at SDK call sites.
 * - `ComponentContext.ContextMenuContent` replaces content-level behavior while preserving
 *   default anchoring/dialog integration from `ContextMenu`.
 * - Built-in call sites (message actions, channel list action buttons, attachment selector,
 *   suggestion list) resolve `ContextMenu` from `ComponentContext` with fallback to default.
 */
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
  SubmenuIcon = IconChevronRight,
  variant,
  ...props
}: BaseContextMenuButtonProps) => (
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
  role = 'menuitem',
  userName,
  ...props
}: UserContextMenuButtonProps) => (
  <button
    {...props}
    className={clsx(
      'str-chat__context-menu__button str-chat__user-context-menu__button',
      className,
    )}
    role={role}
    type='button'
  >
    {/* The avatar is decorative here: the button already carries the user's name as its
        label, so exposing the avatar (its fallback initials, title, and role="button")
        to assistive tech only adds noise to the option's accessible name. */}
    <Avatar aria-hidden imageUrl={imageUrl} size='sm' userName={userName} />
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
  const resolvedAriaLabel = ariaLabel ?? t('aria/Back to parent menu button');
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
  // Fast path: offsetParent is null for display:none elements (and their descendants).
  // offsetHeight covers position:fixed elements which have no offsetParent.
  if (item.offsetParent !== null || item.offsetHeight > 0) return true;

  // In environments without layout (e.g. jsdom), offsetParent/offsetHeight are always 0/null.
  // Fall back to checking inline style and the `hidden` attribute.
  if (item.hidden) return false;
  const display = item.style.display;
  if (display === 'none') return false;

  // If no layout info and no explicit hiding signal, assume visible.
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

  // Prefer the original element if it's still in the DOM.
  if (request.target?.isConnected) return request.target;

  // Fall back to positional index when the element has been unmounted.
  if (request.index >= 0) {
    return (
      getVisibleContextMenuKeyboardNavigationItems(contextMenuRoot)[request.index] ?? null
    );
  }

  return null;
};

const CONTEXT_MENU_HEADER_SELECTOR = '.str-chat__context-menu__header';

/**
 * Where focus should land when a submenu OPENS (forward navigation):
 * - `'first-item'` (default): the first focusable item that is NOT in the header — i.e. the first
 *   real menu option, skipping a back-button header — falling back to the very first item when the
 *   body has none.
 * - `'first'`: the first focusable item overall (the back-button header when present).
 * - `'none'`: do not move focus on open.
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

  // 'first-item': skip the header (e.g. the back button) and land on the first content item;
  // fall back to the first item overall if the body has no focusable item.
  return (
    items.find((item) => !item.closest(CONTEXT_MENU_HEADER_SELECTOR)) ?? items[0] ?? null
  );
};

export type ContextMenuKeyboardNavigation = {
  /**
   * CSS selector used to collect focusable menu items.
   * Defaults to `[role="menuitem"]:not(:disabled)`.
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
  useContext(ContextMenuContext) as ContextMenuContextValue;

type ContextMenuLevel = {
  focusRestoreRequest?: ContextMenuFocusRestoreRequest;
  /**
   * Where focus lands when this level is opened as a submenu (forward navigation). Defaults to
   * `'first-item'`. Ignored for the root level (its initial focus is the dialog's `autoFocus`).
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
  /**
   * Customizes roving-focus keyboard navigation for menu items.
   * ArrowUp/ArrowDown/Home/End move focus across items matched by
   * `keyboardNavigation.itemSelector` (defaults to `[role="menuitem"]:not(:disabled)`).
   * Navigation is always enabled; use this prop only to override the item selector.
   */
  keyboardNavigation?: ContextMenuKeyboardNavigation;
  onClose?: () => void;
  onMenuLevelChange?: (level: number) => void;
  /** Duration (ms) to keep submenu transition direction active for forward/backward animations. */
  submenuTransitionDurationMs?: number;
} & ContextMenuLevel;

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

/**
 * Internal/default content renderer for {@link ContextMenu}.
 *
 * Override this through `ComponentContext.ContextMenuContent` when you need to
 * customize submenu/back navigation behavior while keeping the same anchor/focus
 * handling from `ContextMenu`.
 */
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
  const resolvedBackLabel = backLabel ?? t('Back');
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
  // Where to place focus when the NEXT level opens (forward navigation). Symmetric to
  // `focusRestoreRequestRef`, which handles returning to the parent (backward).
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
      // Record where focus should land in the opening submenu, so the level-change effect can move
      // it there once the new level has rendered (mirrors the backward focus restore). Clear any
      // backward request so the forward intent is what applies for this transition.
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
      // Clear any forward intent so the backward restore is what applies for this transition.
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

  // Move focus on menu-level changes. Runs in a LAYOUT effect (before paint) and re-runs when the
  // body remounts (`menuBodyAnimationKey`) — the body is remounted a step after the level changes
  // to restart the enter animation, which removes the just-focused node. Re-applying focus in the
  // same commit that mounts the new body keeps focus in the menu with no `<body>` flicker (a naive
  // post-paint / single-rAF focus lands one frame before that remount and gets dropped). The
  // request refs are NOT consumed here (so this re-run can re-apply); each transition
  // (`openSubmenu`/`returnToParentMenu`) sets one ref and clears the other.
  useLayoutEffect(() => {
    const focusRestoreRequest = focusRestoreRequestRef.current;
    const pendingForwardFocus = pendingForwardFocusRef.current;
    if (!focusRestoreRequest && !pendingForwardFocus) return;

    const contextMenuRoot = contextMenuRootRef.current;
    // Backward (return to parent) restores the remembered element; it takes precedence.
    const target = focusRestoreRequest
      ? resolveContextMenuFocusRestoreTarget({
          contextMenuRoot,
          request: focusRestoreRequest,
        })
      : // Forward (submenu opened): move focus INTO the new level per its `initialFocus`, so it is
        // not lost to <body> when the parent item that had focus unmounts.
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
        aria-label={isSubmenuLevel ? t('aria/Submenu') : rootAriaLabel}
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
 * Contextual actions menu that can be used in two modes:
 *
 * - Anchored dialog mode: pass `id` + `referenceElement` (submenu-aware positioning).
 * - Inline mode: omit `id` and render a plain contextual list.
 *
 * Customization via `ComponentContext`:
 *
 * - `ContextMenu`: replace the whole menu container/behavior.
 * - `ContextMenuContent`: keep default container behavior but customize menu content
 *   rendering (items, submenu transitions, back navigation UI).
 * - To customize outside-click dismissal via `ComponentContext`, provide a custom
 *   `ContextMenu` that sets `closeOnClickOutside`:
 *
 * ```tsx
 * const CustomContextMenu = (props: ContextMenuProps) => (
 *   <ContextMenu {...props} closeOnClickOutside={false} />
 * );
 *
 * <ComponentProvider value={{ ContextMenu: CustomContextMenu }}>
 *   <Chat client={client}>{children}</Chat>
 * </ComponentProvider>
 * ```
 *
 * Example:
 * ```tsx
 * <ComponentProvider
 *   value={{
 *     ContextMenu: MyContextMenu,
 *     ContextMenuContent: MyContextMenuContent,
 *   }}
 * >
 *   <Chat client={client}>{children}</Chat>
 * </ComponentProvider>
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
