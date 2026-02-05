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
import { IconChevronRight } from '../../Icons';

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
};

export type ContextMenuProps = Omit<ComponentProps<'div'>, 'children'> & {
  backLabel?: ReactNode;
  items: ContextMenuItemComponent[];
  Header?: ContextMenuHeaderComponent;
  ItemsWrapper?: ComponentType<ComponentProps<'div'>>;
  onClose?: () => void;
  onMenuLevelChange?: (level: number) => void;
};

export const ContextMenu = ({
  backLabel = 'Back',
  className,
  Header,
  items,
  ItemsWrapper,
  onClose,
  onMenuLevelChange,
  ...props
}: ContextMenuProps) => {
  const rootLevel = useMemo<ContextMenuLevel>(
    () => ({
      Header,
      items,
      ItemsWrapper,
    }),
    [Header, items, ItemsWrapper],
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
      Submenu,
    }: ContextMenuOpenSubmenuParams) => {
      const nextLevel: ContextMenuLevel = {
        Header,
        ItemsWrapper: SubmenuItemsWrapper ?? ItemsWrapper,
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
      <ContextMenuRoot className={className} {...props}>
        {menuStack.length > 1 &&
          (activeMenu.Header ? (
            <activeMenu.Header />
          ) : (
            <ContextMenuHeader>
              <ContextMenuBackButton onClick={returnToParentMenu}>
                <IconChevronRight />
                <span>{backLabel}</span>
              </ContextMenuBackButton>
            </ContextMenuHeader>
          ))}
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
};
