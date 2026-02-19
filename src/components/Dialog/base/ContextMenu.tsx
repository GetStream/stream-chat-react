/* eslint-disable @typescript-eslint/no-unused-vars */
import React, {
  type ComponentProps,
  type ComponentType,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import clsx from 'clsx';
import { IconChevronLeft } from '../../Icons';
import { useDialogIsOpen } from '../hooks';
import type { DialogAnchorProps } from '../service/DialogAnchor';
import { DialogAnchor } from '../service/DialogAnchor';

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
