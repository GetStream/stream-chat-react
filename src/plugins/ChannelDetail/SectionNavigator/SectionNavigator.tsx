import clsx from 'clsx';
import React, {
  type ComponentProps,
  type ComponentType,
  createContext,
  type HTMLAttributes,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

export type SectionNavigatorLayout = string;

export const SECTION_NAVIGATOR_LAYOUT = {
  inline: 'inline',
  tabs: 'tabs',
} as const;

export type SectionNavigatorRoute = {
  id: string;
};

export type SectionNavigatorSectionContentProps = {
  layout: SectionNavigatorLayout;
};

export type SectionNavigatorNavButtonProps = ComponentProps<'button'> & {
  sectionId: string;
  selected: boolean;
  select: () => void;
};

export type SectionNavigatorSection = {
  id: string;
  NavButton: ComponentType<SectionNavigatorNavButtonProps>;
  SectionContent: ComponentType<SectionNavigatorSectionContentProps>;
};

export type SectionNavigatorLayoutObserverFactory = ({
  element,
  setLayout,
  tabsLayoutMinWidth,
}: {
  element: HTMLElement;
  setLayout: (layout: SectionNavigatorLayout) => void;
  tabsLayoutMinWidth: number;
}) => (() => void) | void;

export type SectionNavigatorContextValue = {
  layout: SectionNavigatorLayout;
  history: SectionNavigatorRoute[];
  historyPop: () => void;
  historyPush: (route: SectionNavigatorRoute) => void;
  /** Whether the navigation drawer overlay is currently open (inline layout only). */
  isNavigationOpen: boolean;
  /** Opens the navigation drawer overlay (inline layout). */
  openNavigation: () => void;
  /** Closes the navigation drawer overlay (inline layout). */
  closeNavigation: () => void;
};

export type SectionNavigatorProps = HTMLAttributes<HTMLDivElement> & {
  sections: SectionNavigatorSection[];
  createLayoutObserver?: SectionNavigatorLayoutObserverFactory;
  defaultLayout?: SectionNavigatorLayout;
  initialHistory?: SectionNavigatorRoute[];
  layout?: SectionNavigatorLayout;
  /** Called whenever the resolved layout changes (and once on mount). */
  onLayoutChange?: (layout: SectionNavigatorLayout) => void;
  tabsLayoutMinWidth?: number;
};

const DEFAULT_TABS_LAYOUT_MIN_WIDTH = 640;

const defaultCreateLayoutObserver: SectionNavigatorLayoutObserverFactory = ({
  element,
  setLayout,
  tabsLayoutMinWidth,
}) => {
  if (typeof ResizeObserver === 'undefined') return;

  const observedElement = element.parentElement ?? element;
  const updateLayout = (width: number) => {
    if (width <= 0) return;

    setLayout(
      width < tabsLayoutMinWidth
        ? SECTION_NAVIGATOR_LAYOUT.inline
        : SECTION_NAVIGATOR_LAYOUT.tabs,
    );
  };
  const observer = new ResizeObserver(([entry]) => {
    updateLayout(entry.contentRect.width);
  });

  updateLayout(observedElement.getBoundingClientRect().width);
  observer.observe(observedElement);

  return () => observer.disconnect();
};

const defaultSectionNavigatorContextValue: SectionNavigatorContextValue = {
  closeNavigation: () => undefined,
  history: [],
  historyPop: () => undefined,
  historyPush: () => undefined,
  isNavigationOpen: false,
  layout: SECTION_NAVIGATOR_LAYOUT.tabs,
  openNavigation: () => undefined,
};

const SectionNavigatorContext = createContext<SectionNavigatorContextValue>(
  defaultSectionNavigatorContextValue,
);

export const useSectionNavigatorContext = () => useContext(SectionNavigatorContext);

const getCurrentRoute = (history: SectionNavigatorRoute[]) => history[history.length - 1];

export const SectionNavigator = ({
  className,
  createLayoutObserver = defaultCreateLayoutObserver,
  defaultLayout = SECTION_NAVIGATOR_LAYOUT.tabs,
  initialHistory,
  layout: controlledLayout,
  onLayoutChange,
  sections,
  tabsLayoutMinWidth = DEFAULT_TABS_LAYOUT_MIN_WIDTH,
  ...props
}: SectionNavigatorProps) => {
  const rootRef = useRef<HTMLDivElement | null>(null);
  const [internalLayout, setInternalLayout] =
    useState<SectionNavigatorLayout>(defaultLayout);
  const [history, setHistory] = useState<SectionNavigatorRoute[]>(
    () => initialHistory ?? (sections[0] ? [{ id: sections[0].id }] : []),
  );
  const [isNavigationOpen, setIsNavigationOpen] = useState(false);
  const layout = controlledLayout ?? internalLayout;
  const currentRoute = getCurrentRoute(history);
  const currentSection = sections.find((section) => section.id === currentRoute?.id);
  const activeSection = currentSection ?? sections[0];
  const isInlineLayout = layout === SECTION_NAVIGATOR_LAYOUT.inline;
  const showDockedNavigation = !isInlineLayout || !currentSection;

  const openNavigation = useCallback(() => setIsNavigationOpen(true), []);
  const closeNavigation = useCallback(() => setIsNavigationOpen(false), []);

  const historyPush = useCallback(
    (route: SectionNavigatorRoute) => {
      setHistory((history) => {
        const currentRoute = getCurrentRoute(history);

        if (currentRoute?.id === route.id) return history;
        if (layout === SECTION_NAVIGATOR_LAYOUT.tabs) return [route];

        return [...history, route];
      });
    },
    [layout],
  );

  const historyPop = useCallback(() => {
    setHistory((history) => (history.length > 1 ? history.slice(0, -1) : history));
  }, []);

  // The drawer overlay only exists in inline layout; close it whenever we leave
  // inline so it cannot linger after a resize to a wider layout.
  useEffect(() => {
    if (!isInlineLayout) setIsNavigationOpen(false);
  }, [isInlineLayout]);

  useEffect(() => {
    if (!isNavigationOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') closeNavigation();
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [closeNavigation, isNavigationOpen]);

  useEffect(() => {
    onLayoutChange?.(layout);
  }, [layout, onLayoutChange]);

  useEffect(() => {
    if (controlledLayout) return;
    if (!rootRef.current) return;

    return createLayoutObserver({
      element: rootRef.current,
      setLayout: setInternalLayout,
      tabsLayoutMinWidth,
    });
  }, [controlledLayout, createLayoutObserver, tabsLayoutMinWidth]);

  useEffect(() => {
    setHistory((history) => {
      const currentRoute = getCurrentRoute(history);
      const currentRouteHasSection = sections.some(
        (section) => section.id === currentRoute?.id,
      );

      if (!currentRoute) return sections[0] ? [{ id: sections[0].id }] : [];

      if (currentRouteHasSection) return history;

      return sections[0] ? [{ id: sections[0].id }] : [];
    });
  }, [sections]);

  const contextValue = useMemo<SectionNavigatorContextValue>(
    () => ({
      closeNavigation,
      history,
      historyPop,
      historyPush,
      isNavigationOpen,
      layout,
      openNavigation,
    }),
    [
      closeNavigation,
      history,
      historyPop,
      historyPush,
      isNavigationOpen,
      layout,
      openNavigation,
    ],
  );

  const Content = activeSection?.SectionContent;

  const navigation = (
    <div className='str-chat__section-navigator__navigation'>
      {sections.map((section) => {
        const NavButton = section.NavButton;
        const selected = activeSection?.id === section.id;

        return (
          <div className='str-chat__section-navigator__navigation-item' key={section.id}>
            <NavButton
              className='str-chat__section-navigator__navigation-item__nav-button'
              sectionId={section.id}
              select={() => {
                historyPush({ id: section.id });
                closeNavigation();
              }}
              selected={selected}
            />
          </div>
        );
      })}
    </div>
  );

  return (
    <SectionNavigatorContext.Provider value={contextValue}>
      <div
        className={clsx('str-chat__section-navigator', className, {
          'str-chat__section-navigator--inline': isInlineLayout,
        })}
        data-layout={layout}
        ref={rootRef}
        {...props}
      >
        {showDockedNavigation && navigation}
        {Content && (
          <div className='str-chat__section-navigator__content'>
            <Content layout={layout} />
          </div>
        )}
        {isInlineLayout && (
          <div
            className={clsx('str-chat__section-navigator__navigation-overlay', {
              'str-chat__section-navigator__navigation-overlay--open': isNavigationOpen,
            })}
          >
            <button
              aria-hidden
              className='str-chat__section-navigator__navigation-scrim'
              onClick={closeNavigation}
              tabIndex={-1}
              type='button'
            />
            <div className='str-chat__section-navigator__navigation-drawer'>
              {navigation}
            </div>
          </div>
        )}
      </div>
    </SectionNavigatorContext.Provider>
  );
};
