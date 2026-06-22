import React from 'react';
import { afterEach, beforeEach, vi } from 'vitest';
import { act, fireEvent, render, screen } from '@testing-library/react';
import {
  SectionNavigator,
  type SectionNavigatorNavButtonProps,
  type SectionNavigatorSection,
  useSectionNavigatorContext,
} from '../SectionNavigator';

const createNavButton = (label: string) => {
  const NavButton = ({ select, selected }: SectionNavigatorNavButtonProps) => (
    <button data-selected={selected} onClick={select} type='button'>
      {label}
    </button>
  );

  return NavButton;
};

const createContent = (label: string) => {
  const Content = ({ layout }: { layout: string }) => {
    const { history, historyPop } = useSectionNavigatorContext();

    return (
      <div>
        <span>{`${label} content ${layout}`}</span>
        <span>{`history length ${history.length}`}</span>
        <button onClick={historyPop} type='button'>
          Back
        </button>
      </div>
    );
  };

  return Content;
};

const createDrawerContent = (label: string) => {
  const Content = () => {
    const { closeNavigation, isNavigationOpen, layout, openNavigation } =
      useSectionNavigatorContext();

    return (
      <div>
        <span>{`${label} content`}</span>
        <span>{`layout ${layout}`}</span>
        <span>{`open ${isNavigationOpen}`}</span>
        <button onClick={openNavigation} type='button'>
          Open menu
        </button>
        <button onClick={closeNavigation} type='button'>
          Close menu
        </button>
      </div>
    );
  };

  return Content;
};

const sections: SectionNavigatorSection[] = [
  {
    id: 'media',
    NavButton: createNavButton('Media nav'),
    SectionContent: createContent('Media'),
  },
  {
    id: 'files',
    NavButton: createNavButton('Files nav'),
    SectionContent: createContent('Files'),
  },
];

const drawerSections: SectionNavigatorSection[] = [
  {
    id: 'media',
    NavButton: createNavButton('Media nav'),
    SectionContent: createDrawerContent('Media'),
  },
  {
    id: 'files',
    NavButton: createNavButton('Files nav'),
    SectionContent: createDrawerContent('Files'),
  },
];

describe('SectionNavigator', () => {
  const OriginalResizeObserver = globalThis.ResizeObserver;
  let observedElements: Element[] = [];
  let resizeObserverCallback: ResizeObserverCallback | undefined;

  beforeEach(() => {
    observedElements = [];
    resizeObserverCallback = undefined;

    globalThis.ResizeObserver = class MockResizeObserver implements ResizeObserver {
      constructor(callback: ResizeObserverCallback) {
        resizeObserverCallback = callback;
      }

      disconnect = vi.fn();
      observe = vi.fn((target: Element) => {
        observedElements.push(target);
      });
      unobserve = vi.fn();
    };
  });

  afterEach(() => {
    globalThis.ResizeObserver = OriginalResizeObserver;
  });

  it('renders navigation and active section content in tabs layout', () => {
    render(<SectionNavigator layout='tabs' sections={sections} />);

    expect(screen.getByText('Media nav')).toBeInTheDocument();
    expect(screen.getByText('Files nav')).toBeInTheDocument();
    expect(screen.getByText('Media content tabs')).toBeInTheDocument();

    fireEvent.click(screen.getByText('Files nav'));

    expect(screen.getByText('Files content tabs')).toBeInTheDocument();
    expect(screen.queryByText('Media content tabs')).not.toBeInTheDocument();
    expect(screen.getByText('history length 1')).toBeInTheDocument();
  });

  it('renders the first section content by default in inline layout', () => {
    const { container } = render(
      <SectionNavigator layout='inline' sections={sections} />,
    );

    expect(container.querySelector('.str-chat__section-navigator')).toHaveAttribute(
      'data-layout',
      'inline',
    );
    expect(screen.getByText('Media content inline')).toBeInTheDocument();
    expect(screen.getByText('history length 1')).toBeInTheDocument();
  });

  it('pops back to the previous content in inline layout', () => {
    const { container, rerender } = render(
      <SectionNavigator layout='inline' sections={sections} />,
    );

    fireEvent.click(screen.getByText('Back'));

    expect(screen.getByText('Media content inline')).toBeInTheDocument();

    rerender(
      <SectionNavigator
        initialHistory={[{ id: 'media' }, { id: 'files' }]}
        key='files-history'
        layout='inline'
        sections={sections}
      />,
    );

    expect(screen.getByText('Files content inline')).toBeInTheDocument();
    expect(screen.getByText('history length 2')).toBeInTheDocument();

    fireEvent.click(screen.getByText('Back'));

    expect(container.querySelector('.str-chat__section-navigator')).toHaveAttribute(
      'data-layout',
      'inline',
    );
    expect(screen.queryByText('Files content inline')).not.toBeInTheDocument();
    expect(screen.getByText('Media content inline')).toBeInTheDocument();
  });

  it('exposes a docked navigation in tabs layout and never opens the drawer overlay', () => {
    const { container } = render(
      <SectionNavigator layout='tabs' sections={drawerSections} />,
    );

    expect(screen.getByText('layout tabs')).toBeInTheDocument();

    fireEvent.click(screen.getByText('Open menu'));

    expect(
      container.querySelector('.str-chat__section-navigator__navigation-overlay'),
    ).not.toBeInTheDocument();
  });

  const OVERLAY_SELECTOR = '.str-chat__section-navigator__navigation-overlay';
  const OVERLAY_OPEN_CLASS = 'str-chat__section-navigator__navigation-overlay--open';

  it('opens a navigation drawer overlay in inline layout and closes it on selection', () => {
    const { container } = render(
      <SectionNavigator layout='inline' sections={drawerSections} />,
    );
    const overlay = () => container.querySelector(OVERLAY_SELECTOR);

    expect(screen.getByText('layout inline')).toBeInTheDocument();
    // The overlay stays mounted in inline layout so it can animate; closed
    // state is signalled by the absence of the `--open` modifier.
    expect(overlay()).toBeInTheDocument();
    expect(overlay()).not.toHaveClass(OVERLAY_OPEN_CLASS);

    fireEvent.click(screen.getByText('Open menu'));

    expect(overlay()).toHaveClass(OVERLAY_OPEN_CLASS);
    expect(screen.getByText('Media nav')).toBeInTheDocument();
    expect(screen.getByText('Files nav')).toBeInTheDocument();

    fireEvent.click(screen.getByText('Files nav'));

    expect(screen.getByText('Files content')).toBeInTheDocument();
    expect(overlay()).not.toHaveClass(OVERLAY_OPEN_CLASS);
  });

  it('closes the navigation drawer when the scrim is clicked', () => {
    const { container } = render(
      <SectionNavigator layout='inline' sections={drawerSections} />,
    );
    const overlay = () => container.querySelector(OVERLAY_SELECTOR);

    fireEvent.click(screen.getByText('Open menu'));
    expect(overlay()).toHaveClass(OVERLAY_OPEN_CLASS);

    const scrim = container.querySelector(
      '.str-chat__section-navigator__navigation-scrim',
    );
    fireEvent.click(scrim as Element);

    expect(overlay()).not.toHaveClass(OVERLAY_OPEN_CLASS);
  });

  it('closes the navigation drawer on Escape', () => {
    const { container } = render(
      <SectionNavigator layout='inline' sections={drawerSections} />,
    );
    const overlay = () => container.querySelector(OVERLAY_SELECTOR);

    fireEvent.click(screen.getByText('Open menu'));
    expect(overlay()).toHaveClass(OVERLAY_OPEN_CLASS);

    fireEvent.keyDown(document, { key: 'Escape' });

    expect(overlay()).not.toHaveClass(OVERLAY_OPEN_CLASS);
  });

  it('lets a custom layout observer set the layout', () => {
    const createLayoutObserver = vi.fn(({ setLayout }) => {
      setLayout('inline');
    });

    const { container } = render(
      <SectionNavigator
        createLayoutObserver={createLayoutObserver}
        sections={sections}
        tabsLayoutMinWidth={720}
      />,
    );

    expect(createLayoutObserver).toHaveBeenCalledWith(
      expect.objectContaining({ tabsLayoutMinWidth: 720 }),
    );
    expect(container.querySelector('.str-chat__section-navigator')).toHaveAttribute(
      'data-layout',
      'inline',
    );
    expect(screen.getByText('Media content inline')).toBeInTheDocument();
  });

  it('observes parent width by default to avoid self-measurement feedback loops', () => {
    render(
      <div data-testid='observer-parent'>
        <SectionNavigator sections={sections} />
      </div>,
    );

    expect(observedElements[0]).toBe(screen.getByTestId('observer-parent'));
  });

  it('ignores zero-width observer entries before applying the resolved layout', () => {
    const { container } = render(
      <div data-testid='observer-parent'>
        <SectionNavigator sections={sections} />
      </div>,
    );
    const root = () => container.querySelector('.str-chat__section-navigator');

    expect(root()).toHaveAttribute('data-layout', 'tabs');

    act(() => {
      resizeObserverCallback?.(
        [{ contentRect: { width: 0 } as DOMRectReadOnly } as ResizeObserverEntry],
        {} as ResizeObserver,
      );
    });

    expect(root()).toHaveAttribute('data-layout', 'tabs');

    act(() => {
      resizeObserverCallback?.(
        [{ contentRect: { width: 320 } as DOMRectReadOnly } as ResizeObserverEntry],
        {} as ResizeObserver,
      );
    });

    expect(root()).toHaveAttribute('data-layout', 'inline');

    act(() => {
      resizeObserverCallback?.(
        [{ contentRect: { width: 800 } as DOMRectReadOnly } as ResizeObserverEntry],
        {} as ResizeObserver,
      );
    });

    expect(root()).toHaveAttribute('data-layout', 'tabs');
  });

  it('uses tabsLayoutMinWidth to resolve the default observer layout', () => {
    const { container } = render(
      <div data-testid='observer-parent'>
        <SectionNavigator sections={sections} tabsLayoutMinWidth={800} />
      </div>,
    );
    const root = () => container.querySelector('.str-chat__section-navigator');

    act(() => {
      resizeObserverCallback?.(
        [{ contentRect: { width: 640 } as DOMRectReadOnly } as ResizeObserverEntry],
        {} as ResizeObserver,
      );
    });

    expect(root()).toHaveAttribute('data-layout', 'inline');

    act(() => {
      resizeObserverCallback?.(
        [{ contentRect: { width: 960 } as DOMRectReadOnly } as ResizeObserverEntry],
        {} as ResizeObserver,
      );
    });

    expect(root()).toHaveAttribute('data-layout', 'tabs');
  });
});
