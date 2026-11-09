import React from 'react';
import { render } from '@testing-library/react';
import { fromPartial } from '@total-typescript/shoehorn';

import { InfiniteScroll } from '../';
import type { InfiniteScrollProps } from '../InfiniteScroll';

const loadPreviousPage = vi.fn().mockImplementation(() => Promise.resolve());

// jsdom does not implement offsetHeight / offsetTop / offsetParent, so testing real scroll behavior
// would mean mocking nearly everything and only testing the implementation.

describe('InfiniteScroll', () => {
  // Spying on the prototype captures listeners added to any element.
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
      // The wheel listener is added without capture whatever `useCapture` is.
      expect(removeEventListenerSpy).toHaveBeenCalledWith('wheel', expect.any(Function));
      expect(removeEventListenerSpy).toHaveBeenCalledWith(
        'resize',
        expect.any(Function),
        useCapture,
      );
    },
  );

  it.each([true, false])(
    'stops preventing wheel events after unmount with useCapture as %s',
    (useCapture) => {
      const { scrollParent, unmount } = renderComponent({
        hasPreviousPage: true,
        useCapture,
      });

      unmount();

      const wheelEvent = new WheelEvent('wheel', { cancelable: true, deltaY: 1 });
      scrollParent.dispatchEvent(wheelEvent);
      expect(wheelEvent.defaultPrevented).toBe(false);
    },
  );

  it('should not call loadPreviousPage synchronously on mount', () => {
    renderComponent({
      hasPreviousPage: true,
    });

    expect(loadPreviousPage).not.toHaveBeenCalled();
  });

  it('should defer the initial scroll check to a requestAnimationFrame', () => {
    const rafSpy = vi.spyOn(window, 'requestAnimationFrame');

    renderComponent({
      hasPreviousPage: true,
    });

    expect(rafSpy).toHaveBeenCalledWith(expect.any(Function));
    rafSpy.mockRestore();
  });

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
