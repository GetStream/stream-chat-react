import { render, screen } from '@testing-library/react';
import React from 'react';

import { VirtualizedList } from '../VirtualizedList';

type VirtuosoCapturedProps = {
  atBottomStateChange?: (atBottom: boolean) => void;
  components?: {
    EmptyPlaceholder?: React.ComponentType;
    Footer?: React.ComponentType;
    List?: React.ComponentType<{ children?: React.ReactNode }>;
  };
  data?: unknown[];
  itemContent?: (index: number, item: unknown) => React.ReactNode;
};

const mocks = vi.hoisted(() => ({
  lastProps: undefined as VirtuosoCapturedProps | undefined,
}));

// Capture the props handed to Virtuoso and render items/slots synchronously so
// the wrapper's wiring (loadNext, empty/footer slots, data) is observable.
vi.mock('react-virtuoso', () => ({
  Virtuoso: (props: VirtuosoCapturedProps) => {
    mocks.lastProps = props;
    const { components = {}, data = [], itemContent } = props;
    const { EmptyPlaceholder, Footer, List } = components;
    const Wrapper = List ?? React.Fragment;
    return (
      <div data-testid='virtuoso'>
        {data.length === 0 ? (
          EmptyPlaceholder && <EmptyPlaceholder />
        ) : (
          <Wrapper>
            {data.map((item, index) => (
              <React.Fragment key={index}>{itemContent?.(index, item)}</React.Fragment>
            ))}
          </Wrapper>
        )}
        {Footer && <Footer />}
      </div>
    );
  },
}));

describe('VirtualizedList', () => {
  beforeEach(() => {
    mocks.lastProps = undefined;
  });

  it('renders each item through itemContent', () => {
    render(
      <VirtualizedList
        data={['a', 'b']}
        itemContent={(_, item) => <span>{`item-${item}`}</span>}
      />,
    );

    expect(screen.getByText('item-a')).toBeInTheDocument();
    expect(screen.getByText('item-b')).toBeInTheDocument();
  });

  it('renders the EmptyPlaceholder when there are no items', () => {
    render(
      <VirtualizedList
        data={[]}
        EmptyPlaceholder={() => <div>nothing here</div>}
        itemContent={() => null}
      />,
    );

    expect(screen.getByText('nothing here')).toBeInTheDocument();
  });

  it('renders the Footer slot', () => {
    render(
      <VirtualizedList
        data={['a']}
        Footer={() => <div>footer</div>}
        itemContent={(_, item) => <span>{`item-${item}`}</span>}
      />,
    );

    expect(screen.getByText('footer')).toBeInTheDocument();
  });

  it('calls loadNext only when scrolled to the bottom', () => {
    const loadNext = vi.fn();

    render(<VirtualizedList data={['a']} itemContent={() => null} loadNext={loadNext} />);

    mocks.lastProps?.atBottomStateChange?.(false);
    expect(loadNext).not.toHaveBeenCalled();

    mocks.lastProps?.atBottomStateChange?.(true);
    expect(loadNext).toHaveBeenCalledTimes(1);
  });

  it('does not throw when scrolled to the bottom without a loadNext handler', () => {
    render(<VirtualizedList data={['a']} itemContent={() => null} />);

    expect(() => mocks.lastProps?.atBottomStateChange?.(true)).not.toThrow();
  });
});
