import React from 'react';
import { render } from '@testing-library/react';
import { fromPartial } from '@total-typescript/shoehorn';

import { InfiniteScroll } from '../';
import type { InfiniteScrollProps } from '../InfiniteScroll';

const loadPreviousPage = vi.fn().mockImplementation(() => Promise.resolve());

// Note: testing actual infinite scroll behavior is very tricky / pointless because Jest does not
// really implement offsetHeight / offsetTop / offsetParent etc. This means we'd have to mock basically everything,
// which just tests implementation rather than actual user experience.

describe('InfiniteScroll', () => {
  // not sure if there is a more 'narrow' way of capturing event listeners being added
  const divAddEventListenerSpy = vi.spyOn(EventTarget.prototype, 'addEventListener');

  const divRemoveEventListenerSpy = vi.spyOn(
    EventTarget.prototype,
    'removeEventListener',
  );

  afterEach(() => {
    vi.clearAllMocks();
  });

  const renderComponent = (props) => {
    const renderResult = render(
      <div data-testid='scroll-parent'>
        <InfiniteScroll loadPreviousPage={loadPreviousPage} {...props} />
      </div>,
    );
    const scrollParent = renderResult.getByTestId('scroll-parent');
    return { scrollParent, ...renderResult };
  };

  it.each([true, false])(
    'should bind scroll, mousewheel and resize events to the right target with useCapture as %s',
    (useCapture) => {
      renderComponent({
        hasPreviousPage: true,
        useCapture,
      });

      const addEventListenerSpy = divAddEventListenerSpy;

      expect(addEventListenerSpy).toHaveBeenCalledWith(
        'scroll',
        expect.any(Function),
        useCapture,
      );
      expect(addEventListenerSpy).toHaveBeenCalledWith('wheel', expect.any(Function), {
        passive: false,
      });
      expect(addEventListenerSpy).toHaveBeenCalledWith(
        'resize',
        expect.any(Function),
        useCapture,
      );
    },
  );

  it.each([true, false])(
    'should unbind scroll, mousewheel and resize events from the right target with useCapture as %s',
    (useCapture) => {
      const { unmount } = renderComponent({
        hasPreviousPage: true,
        useCapture,
      });

      unmount();

      const removeEventListenerSpy = divRemoveEventListenerSpy;

      expect(removeEventListenerSpy).toHaveBeenCalledWith(
        'scroll',
        expect.any(Function),
        useCapture,
      );
      expect(removeEventListenerSpy).toHaveBeenCalledWith(
        'wheel',
        expect.any(Function),
        useCapture,
      );
      expect(removeEventListenerSpy).toHaveBeenCalledWith(
        'resize',
        expect.any(Function),
        useCapture,
      );
    },
  );

  describe('Rendering loader', () => {
    const getRenderResult = () => {
      const props = fromPartial<InfiniteScrollProps>({
        isLoading: true,
        loader: <div key='loader'>loader</div>,
        loadPreviousPage,
      });
      return render(<InfiniteScroll {...props}>Content</InfiniteScroll>);
    };
    it('should render the loader in the right place if queryInProgress is true', () => {
      const { container } = getRenderResult();
      expect(container).toMatchInlineSnapshot(`
        <div>
          <div>
            <div>
              loader
            </div>
            Content
          </div>
        </div>
      `);
    });
  });
});
