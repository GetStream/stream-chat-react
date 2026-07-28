import React from 'react';
import { render, screen } from '@testing-library/react';

import { useInertWhenHidden } from '../useInertWhenHidden';
import type { UseInertWhenHiddenOptions } from '../useInertWhenHidden';

const TestButton = ({
  hidden,
  options,
}: {
  hidden: boolean;
  options?: UseInertWhenHiddenOptions;
}) => {
  const inertProps = useInertWhenHidden(hidden, options);

  return (
    <button data-testid='target' {...inertProps}>
      Add attachment
    </button>
  );
};

describe('useInertWhenHidden', () => {
  describe('when hidden', () => {
    it('removes the element from the accessibility tree', () => {
      render(<TestButton hidden />);

      // `hidden` / `aria-hidden` keep the button out of the a11y tree.
      expect(screen.queryByRole('button')).toBeNull();
    });

    it('makes the element unreachable via Tab and non-interactive', () => {
      render(<TestButton hidden />);
      const button = screen.getByTestId('target');

      expect(button).toHaveAttribute('aria-hidden', 'true');
      expect(button).toHaveAttribute('hidden');
      expect(button).toHaveAttribute('tabindex', '-1');
      expect(button).toHaveAttribute('inert');
    });
  });

  describe('when shown', () => {
    it('keeps the element in the accessibility tree', () => {
      render(<TestButton hidden={false} />);

      expect(screen.getByRole('button', { name: 'Add attachment' })).toBeInTheDocument();
    });

    it('leaves the element reachable and interactive (no a11y/focus attributes)', () => {
      render(<TestButton hidden={false} />);
      const button = screen.getByTestId('target');

      expect(button).not.toHaveAttribute('aria-hidden');
      expect(button).not.toHaveAttribute('hidden');
      expect(button).not.toHaveAttribute('tabindex');
      expect(button).not.toHaveAttribute('inert');
    });
  });

  describe('with { setHiddenAttribute: false }', () => {
    it('omits the `hidden` attribute while keeping a11y/focus removal when hidden', () => {
      render(<TestButton hidden options={{ setHiddenAttribute: false }} />);
      const button = screen.getByTestId('target');

      expect(button).toHaveAttribute('aria-hidden', 'true');
      expect(button).toHaveAttribute('tabindex', '-1');
      expect(button).toHaveAttribute('inert');
      expect(button).not.toHaveAttribute('hidden');
    });

    it('keeps the element queryable by role (no `hidden` attribute) when hidden', () => {
      render(<TestButton hidden options={{ setHiddenAttribute: false }} />);

      // Without the `hidden` attribute, the element is not display:none, but
      // `aria-hidden` still removes it from the accessibility tree.
      expect(screen.queryByRole('button')).toBeNull();
      expect(screen.getByTestId('target')).toBeInTheDocument();
    });

    it('emits no a11y/focus attributes when shown', () => {
      render(<TestButton hidden={false} options={{ setHiddenAttribute: false }} />);
      const button = screen.getByTestId('target');

      expect(button).not.toHaveAttribute('aria-hidden');
      expect(button).not.toHaveAttribute('hidden');
      expect(button).not.toHaveAttribute('tabindex');
      expect(button).not.toHaveAttribute('inert');
    });
  });

  it('returns a stable, memoized props object across re-renders with the same value', () => {
    const seen: object[] = [];

    const Capture = ({ hidden }: { hidden: boolean }) => {
      const inertProps = useInertWhenHidden(hidden);
      seen.push(inertProps);
      return null;
    };

    const { rerender } = render(<Capture hidden />);
    rerender(<Capture hidden />);

    expect(seen[0]).toBe(seen[1]);
  });
});
