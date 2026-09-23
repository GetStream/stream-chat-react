import React from 'react';
import { render, renderHook, screen } from '@testing-library/react';
import type { PropsWithChildren } from 'react';

import { useComponentContextIcons } from '../useComponentContextIcons';
import { WithComponents } from '../WithComponents';
import * as DEFAULT_ICONS from '../../components/Icons/icons';
import type { IconSlots } from '../../components/Icons/slots';

const CustomFlag = () => <svg data-testid='custom-flag' />;
const CustomSend = () => <svg data-testid='custom-send' />;

const withIcons = (icons: IconSlots) =>
  function Wrapper({ children }: PropsWithChildren) {
    return <WithComponents overrides={{ icons }}>{children}</WithComponents>;
  };

describe('useComponentContextIcons', () => {
  it('returns the SDK icons when nothing is overridden', () => {
    const { result } = renderHook(() => useComponentContextIcons());

    expect(result.current.IconFlag).toBe(DEFAULT_ICONS.IconFlag);
    expect(result.current.IconSend).toBe(DEFAULT_ICONS.IconSend);
  });

  it('covers every icon the SDK exports, so call sites can destructure without fallbacks', () => {
    const { result } = renderHook(() => useComponentContextIcons());

    const exported = Object.keys(DEFAULT_ICONS).sort();
    expect(Object.keys(result.current).sort()).toEqual(exported);
    expect(Object.values(result.current).every(Boolean)).toBe(true);
  });

  it('overriding one icon leaves its siblings intact', () => {
    const { result } = renderHook(() => useComponentContextIcons(), {
      wrapper: withIcons({ IconFlag: CustomFlag }),
    });

    expect(result.current.IconFlag).toBe(CustomFlag);
    expect(result.current.IconSend).toBe(DEFAULT_ICONS.IconSend);
  });

  it('a nested provider merges with an ancestor rather than clearing it', () => {
    const wrapper = ({ children }: PropsWithChildren) => (
      <WithComponents overrides={{ icons: { IconFlag: CustomFlag } }}>
        <WithComponents overrides={{ icons: { IconSend: CustomSend } }}>
          {children}
        </WithComponents>
      </WithComponents>
    );

    const { result } = renderHook(() => useComponentContextIcons(), { wrapper });

    expect(result.current.IconFlag).toBe(CustomFlag);
    expect(result.current.IconSend).toBe(CustomSend);
  });

  it('a nested provider wins for a slot the ancestor also set', () => {
    const wrapper = ({ children }: PropsWithChildren) => (
      <WithComponents overrides={{ icons: { IconFlag: CustomFlag } }}>
        <WithComponents overrides={{ icons: { IconFlag: CustomSend } }}>
          {children}
        </WithComponents>
      </WithComponents>
    );

    const { result } = renderHook(() => useComponentContextIcons(), { wrapper });

    expect(result.current.IconFlag).toBe(CustomSend);
  });

  it('a slot explicitly set to undefined falls back to the SDK icon', () => {
    const { result } = renderHook(() => useComponentContextIcons(), {
      wrapper: withIcons({ IconFlag: undefined }),
    });

    expect(result.current.IconFlag).toBe(DEFAULT_ICONS.IconFlag);
  });

  it('keeps each icon component stable across re-renders, so icon subtrees are not remounted', () => {
    // What React compares when deciding to remount is the element type — the icon component
    // itself — not the object holding it. That stays stable even when a consumer passes
    // `overrides` inline and the containing object is rebuilt.
    const { rerender, result } = renderHook(() => useComponentContextIcons(), {
      wrapper: withIcons({ IconFlag: CustomFlag }),
    });

    const { IconFlag: firstFlag, IconSend: firstSend } = result.current;
    rerender();

    expect(result.current.IconFlag).toBe(firstFlag);
    expect(result.current.IconSend).toBe(firstSend);
  });

  it('returns the same object across re-renders when the consumer memoizes its overrides', () => {
    const overrides = { icons: { IconFlag: CustomFlag } };
    const wrapper = ({ children }: PropsWithChildren) => (
      <WithComponents overrides={overrides}>{children}</WithComponents>
    );
    const { rerender, result } = renderHook(() => useComponentContextIcons(), {
      wrapper,
    });

    const first = result.current;
    rerender();

    expect(result.current).toBe(first);
  });

  it('picks up an override swapped at runtime', () => {
    // The reason this hook keys its memo on `icons` rather than on `[]`: a consumer that swaps an
    // icon after mount must see the new one. Keyed on `[]` this assertion fails.
    const Probe = () => {
      const { IconFlag } = useComponentContextIcons();
      return <IconFlag />;
    };
    const Tree = ({ icons }: { icons: IconSlots }) => (
      <WithComponents overrides={{ icons }}>
        <Probe />
      </WithComponents>
    );

    const { rerender } = render(<Tree icons={{ IconFlag: CustomFlag }} />);
    expect(screen.getByTestId('custom-flag')).toBeInTheDocument();

    rerender(<Tree icons={{ IconFlag: CustomSend }} />);

    expect(screen.queryByTestId('custom-flag')).not.toBeInTheDocument();
    expect(screen.getByTestId('custom-send')).toBeInTheDocument();
  });

  it('a non-component override does not overwrite the SDK icon', () => {
    const { result } = renderHook(() => useComponentContextIcons(), {
      // a consumer computing overrides dynamically can hand us a hole
      wrapper: withIcons({ IconFlag: null as unknown as IconSlots['IconFlag'] }),
    });

    expect(result.current.IconFlag).toBe(DEFAULT_ICONS.IconFlag);
  });
});
