import { renderHook } from '@testing-library/react';

import { useFocusReturn } from '../useFocusReturn';

describe('useFocusReturn', () => {
  afterEach(() => {
    document.body.innerHTML = '';
  });

  it('restores focus to the element that was focused at reserve time (origin)', () => {
    const origin = document.createElement('input');
    document.body.append(origin);
    origin.focus();
    expect(document.activeElement).toBe(origin);

    const stealer = document.createElement('button');
    document.body.append(stealer);

    const { result } = renderHook(() => useFocusReturn());
    result.current.reserve(); // capture origin
    stealer.focus(); // steal
    expect(document.activeElement).toBe(stealer);

    result.current.restore();
    expect(document.activeElement).toBe(origin);
  });

  it('honors an explicit target over the current activeElement', () => {
    const origin = document.createElement('input');
    const explicit = document.createElement('input');
    document.body.append(origin, explicit);
    origin.focus();

    const { result } = renderHook(() => useFocusReturn());
    result.current.reserve({ target: explicit });
    result.current.restore();

    expect(document.activeElement).toBe(explicit);
  });

  it('does not throw and is a no-op when nothing was reserved', () => {
    const { result } = renderHook(() => useFocusReturn());
    expect(() => result.current.restore()).not.toThrow();
  });

  it('does not throw when the reserved element was removed before restore', () => {
    const origin = document.createElement('input');
    document.body.append(origin);
    origin.focus();

    const { result } = renderHook(() => useFocusReturn());
    result.current.reserve();
    origin.remove();

    expect(() => result.current.restore()).not.toThrow();
  });

  it('reserves nothing when the candidate is document.body / not focusable', () => {
    // activeElement defaults to <body> when nothing is focused.
    const { result } = renderHook(() => useFocusReturn());
    result.current.reserve();
    const focusSpy = vi.spyOn(document.body, 'focus');
    result.current.restore();
    expect(focusSpy).not.toHaveBeenCalled();
  });

  it('clears the reservation after restoring (single-shot)', () => {
    const origin = document.createElement('input');
    const other = document.createElement('input');
    document.body.append(origin, other);
    origin.focus();

    const { result } = renderHook(() => useFocusReturn());
    result.current.reserve();
    result.current.restore();
    expect(document.activeElement).toBe(origin);

    other.focus();
    result.current.restore(); // nothing reserved now → no-op
    expect(document.activeElement).toBe(other);
  });

  it('returns stable callbacks across renders', () => {
    const { rerender, result } = renderHook(() => useFocusReturn());
    const first = result.current;
    rerender();
    expect(result.current.reserve).toBe(first.reserve);
    expect(result.current.restore).toBe(first.restore);
  });
});
