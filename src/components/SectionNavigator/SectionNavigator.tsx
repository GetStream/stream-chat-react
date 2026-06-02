import clsx from 'clsx';
import React, {
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

export type SectionNavigatorNavButtonProps = {
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
};

export type SectionNavigatorProps = HTMLAttributes<HTMLDivElement> & {
  sections: SectionNavigatorSection[];
  createLayoutObserver?: SectionNavigatorLayoutObserverFactory;
  defaultLayout?: SectionNavigatorLayout;
  initialHistory?: SectionNavigatorRoute[];
  layout?: SectionNavigatorLayout;
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
  history: [],
  historyPop: () => undefined,
  historyPush: () => undefined,
  layout: SECTION_NAVIGATOR_LAYOUT.tabs,
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
  const layout = controlledLayout ?? internalLayout;
  const currentRoute = getCurrentRoute(history);
  const currentSection = sections.find((section) => section.id === currentRoute?.id);
  const activeSection = currentSection ?? sections[0];
  const isInlineLayout = layout === SECTION_NAVIGATOR_LAYOUT.inline;
  const showNavigation = !isInlineLayout || !currentSection;

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
      history,
      historyPop,
      historyPush,
      layout,
    }),
    [history, historyPop, historyPush, layout],
  );

  const Content = activeSection?.SectionContent;

  return (
    <SectionNavigatorContext.Provider value={contextValue}>
      <div
        className={clsx('str-chat__section-navigator', className)}
        data-layout={layout}
        ref={rootRef}
        {...props}
      >
        {showNavigation && (
          <div className='str-chat__section-navigator__navigation'>
            {sections.map((section) => {
              const NavButton = section.NavButton;
              const selected = activeSection?.id === section.id;

              return (
                <div
                  className='str-chat__section-navigator__navigation-item'
                  key={section.id}
                >
                  <NavButton
                    sectionId={section.id}
                    select={() => historyPush({ id: section.id })}
                    selected={selected}
                  />
                </div>
              );
            })}
          </div>
        )}
        {Content && (
          <div className='str-chat__section-navigator__content'>
            <Content layout={layout} />
          </div>
        )}
      </div>
    </SectionNavigatorContext.Provider>
  );
};
