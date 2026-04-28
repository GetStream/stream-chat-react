import React from 'react';
import { render, screen } from '@testing-library/react';

import { BaseIcon } from '../BaseIcon';
import { createIcon } from '../createIcon';

describe('BaseIcon', () => {
  it('is decorative by default', () => {
    render(<BaseIcon data-testid='icon' />);

    const icon = screen.getByTestId('icon');
    expect(icon).toHaveAttribute('aria-hidden', 'true');
    expect(icon).toHaveAttribute('focusable', 'false');
  });

  it('supports non-decorative usage', () => {
    render(<BaseIcon data-testid='icon' decorative={false} />);

    const icon = screen.getByTestId('icon');
    expect(icon).not.toHaveAttribute('aria-hidden');
    expect(icon).not.toHaveAttribute('focusable');
  });

  it('respects explicit aria-hidden overrides', () => {
    render(<BaseIcon aria-hidden={false} data-testid='icon' />);

    expect(screen.getByTestId('icon')).toHaveAttribute('aria-hidden', 'false');
  });
});

describe('createIcon', () => {
  const IconTest = createIcon('IconTest', <path d='M0 0H1V1H0z' />);

  it('creates decorative icons by default', () => {
    render(<IconTest data-testid='icon' />);

    expect(screen.getByTestId('icon')).toHaveAttribute('aria-hidden', 'true');
  });

  it('allows decorative icons to be opt-out', () => {
    render(<IconTest data-testid='icon' decorative={false} />);

    expect(screen.getByTestId('icon')).not.toHaveAttribute('aria-hidden');
  });
});
