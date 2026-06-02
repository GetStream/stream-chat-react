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
    render(<SectionNavigator layout='inline' sections={sections} />);

    expect(screen.queryByText('Media nav')).not.toBeInTheDocument();
    expect(screen.queryByText('Files nav')).not.toBeInTheDocument();
    expect(screen.getByText('Media content inline')).toBeInTheDocument();
    expect(screen.getByText('history length 1')).toBeInTheDocument();
  });

  it('pops back to the previous content in inline layout', () => {
    const { rerender } = render(<SectionNavigator layout='inline' sections={sections} />);

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

    expect(screen.queryByText('Media nav')).not.toBeInTheDocument();
    expect(screen.queryByText('Files nav')).not.toBeInTheDocument();
    expect(screen.queryByText('Files content inline')).not.toBeInTheDocument();
    expect(screen.getByText('Media content inline')).toBeInTheDocument();
  });

  it('lets a custom layout observer set the layout', () => {
    const createLayoutObserver = vi.fn(({ setLayout }) => {
      setLayout('inline');
    });

    render(
      <SectionNavigator
        createLayoutObserver={createLayoutObserver}
        sections={sections}
        tabsLayoutMinWidth={720}
      />,
    );

    expect(createLayoutObserver).toHaveBeenCalledWith(
      expect.objectContaining({ tabsLayoutMinWidth: 720 }),
    );
    expect(screen.queryByText('Media nav')).not.toBeInTheDocument();
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
    render(
      <div data-testid='observer-parent'>
        <SectionNavigator sections={sections} />
      </div>,
    );

    expect(screen.getByText('Media nav')).toBeInTheDocument();

    act(() => {
      resizeObserverCallback?.(
        [{ contentRect: { width: 0 } as DOMRectReadOnly } as ResizeObserverEntry],
        {} as ResizeObserver,
      );
    });

    expect(screen.getByText('Media nav')).toBeInTheDocument();

    act(() => {
      resizeObserverCallback?.(
        [{ contentRect: { width: 320 } as DOMRectReadOnly } as ResizeObserverEntry],
        {} as ResizeObserver,
      );
    });

    expect(screen.queryByText('Media nav')).not.toBeInTheDocument();

    act(() => {
      resizeObserverCallback?.(
        [{ contentRect: { width: 800 } as DOMRectReadOnly } as ResizeObserverEntry],
        {} as ResizeObserver,
      );
    });

    expect(screen.getByText('Media nav')).toBeInTheDocument();
  });

  it('uses tabsLayoutMinWidth to resolve the default observer layout', () => {
    render(
      <div data-testid='observer-parent'>
        <SectionNavigator sections={sections} tabsLayoutMinWidth={800} />
      </div>,
    );

    act(() => {
      resizeObserverCallback?.(
        [{ contentRect: { width: 640 } as DOMRectReadOnly } as ResizeObserverEntry],
        {} as ResizeObserver,
      );
    });

    expect(screen.queryByText('Media nav')).not.toBeInTheDocument();

    act(() => {
      resizeObserverCallback?.(
        [{ contentRect: { width: 960 } as DOMRectReadOnly } as ResizeObserverEntry],
        {} as ResizeObserver,
      );
    });

    expect(screen.getByText('Media nav')).toBeInTheDocument();
  });
});
