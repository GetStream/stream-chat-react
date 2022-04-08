import React from 'react';
import { render } from '@testing-library/react';
import '@testing-library/jest-dom';
import renderer from 'react-test-renderer';

import { InfiniteScroll } from '../';

const loadMore = jest.fn().mockImplementation(() => Promise.resolve());

// Note: testing actual infinite scroll behavior is very tricky / pointless because Jest does not
// really implement offsetHeight / offsetTop / offsetParent etc. This means we'd have to mock basically everything,
// which just tests implementation rather than actual user experience.

describe('InfiniteScroll', () => {
  // not sure if there is a more 'narrow' way of capturing event listeners being added
  const divAddEventListenerSpy = jest.spyOn(HTMLDivElement.prototype, 'addEventListener');

  const divRemoveEventListenerSpy = jest.spyOn(HTMLDivElement.prototype, 'addEventListener');

  afterEach(() => {
    jest.clearAllMocks();
  });

  const renderComponent = (props) => {
    const renderResult = render(
      <div data-testid='scroll-parent'>
        <InfiniteScroll loadMore={loadMore} {...props} />
      </div>,
    );
    const scrollParent = renderResult.getByTestId('scroll-parent');
    return { scrollParent, ...renderResult };
  };

  it.each([true, false])(
    'should bind scroll, mousewheel and resize events to the right target with useCapture as %s',
    (useCapture) => {
      renderComponent({
        hasMore: true,
        useCapture,
      });

      const addEventListenerSpy = divAddEventListenerSpy;

      expect(addEventListenerSpy).toHaveBeenCalledWith('scroll', expect.any(Function), useCapture);
      expect(addEventListenerSpy).toHaveBeenCalledWith('wheel', expect.any(Function), {
        passive: false,
      });
      expect(addEventListenerSpy).toHaveBeenCalledWith('resize', expect.any(Function), useCapture);
    },
  );

  it.each([true, false])(
    'should unbind scroll, mousewheel and resize events from the right target with useCapture as %s',
    (useCapture) => {
      const { unmount } = renderComponent({
        hasMore: true,
        useCapture,
      });

      unmount();

      const removeEventListenerSpy = divRemoveEventListenerSpy;

      expect(removeEventListenerSpy).toHaveBeenCalledWith(
        'scroll',
        expect.any(Function),
        useCapture,
      );
      expect(removeEventListenerSpy).toHaveBeenCalledWith('wheel', expect.any(Function), {
        passive: false,
      });
      expect(removeEventListenerSpy).toHaveBeenCalledWith(
        'resize',
        expect.any(Function),
        useCapture,
      );
    },
  );

  describe('Rendering loader', () => {
    const getRenderResult = () =>
      renderer
        .create(
          <InfiniteScroll isLoading loader={<div key='loader'>loader</div>} loadMore={loadMore}>
            Content
          </InfiniteScroll>,
        )
        .toJSON();
    it('should render the loader in the right place if isLoading is true', () => {
      expect(getRenderResult()).toMatchInlineSnapshot(`
        <div>
          <div>
            loader
          </div>
          Content
        </div>
      `);
    });
  });
});
