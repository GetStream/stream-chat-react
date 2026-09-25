import React, { StrictMode } from 'react';
import { render, waitFor } from '@testing-library/react';
import { Picker } from '../Picker';

// Minimal payload in the shape emoji-mart expects, so the picker can initialize without
// pulling in the full @emoji-mart/data set.
const data = {
  aliases: {},
  categories: [{ emojis: ['grinning'], id: 'people' }],
  emojis: {
    grinning: {
      id: 'grinning',
      keywords: ['face', 'smile'],
      name: 'Grinning Face',
      skins: [{ native: '😀', unified: '1f600' }],
      version: 1,
    },
  },
  sheet: { cols: 60, rows: 60 },
};

const pickerElements = (container: HTMLElement) =>
  container.querySelectorAll('em-emoji-picker');

const getRenderedPicker = async (container: HTMLElement) => {
  await waitFor(() => expect(pickerElements(container)).toHaveLength(1));
  const element = container.querySelector('em-emoji-picker');
  // emoji-mart renders into a shadow root from an async `connectedCallback`, so wait for
  // the UI itself rather than just the custom element wrapper.
  await waitFor(() =>
    expect(element?.shadowRoot?.querySelector('input[type="search"]')).toBeTruthy(),
  );
  return element;
};

describe('Emojis/Picker', () => {
  const OriginalIntersectionObserver = globalThis.IntersectionObserver;

  beforeEach(() => {
    // emoji-mart observes emoji category rows to lazy-render them; jsdom has no
    // IntersectionObserver, and without a stub the picker's componentDidMount rejects.
    // @ts-expect-error intersection observer stubs
    globalThis.IntersectionObserver = class MockIntersectionObserver implements IntersectionObserver {
      root = null;
      rootMargin = '';
      thresholds = [];
      disconnect = vi.fn();
      observe = vi.fn();
      takeRecords = vi.fn(() => []);
      unobserve = vi.fn();
    };
  });

  afterEach(() => {
    globalThis.IntersectionObserver = OriginalIntersectionObserver;
  });

  it('mounts exactly one emoji-mart picker element', async () => {
    const { container } = render(<Picker data={data} />);
    await getRenderedPicker(container);
  });

  it('mounts exactly one emoji-mart picker element under StrictMode', async () => {
    // StrictMode double-invokes effects (mount -> cleanup -> mount), so the wrapper
    // constructs a second emoji-mart Picker against the same container. It stays at one
    // element only because emoji-mart clears the container (`ref.innerHTML = ''`) before
    // appending. If that ever changes upstream, this catches the duplicated picker.
    const { container } = render(
      <StrictMode>
        <Picker data={data} />
      </StrictMode>,
    );

    await getRenderedPicker(container);
  });

  it('updates the existing instance on re-render instead of remounting it', async () => {
    const { container, rerender } = render(<Picker data={data} theme='light' />);

    const element = await getRenderedPicker(container);
    expect(element?.shadowRoot?.querySelector('#root')).toHaveAttribute(
      'data-theme',
      'light',
    );

    rerender(<Picker data={data} theme='dark' />);

    await waitFor(() =>
      expect(element?.shadowRoot?.querySelector('#root')).toHaveAttribute(
        'data-theme',
        'dark',
      ),
    );
    // the same custom element instance was updated in place, not torn down and rebuilt
    expect(pickerElements(container)).toHaveLength(1);
    expect(container.querySelector('em-emoji-picker')).toBe(element);
  });

  it('removes the picker element on unmount', async () => {
    const { container, unmount } = render(<Picker data={data} />);
    await getRenderedPicker(container);
    unmount();
    expect(pickerElements(container)).toHaveLength(0);
  });
});
