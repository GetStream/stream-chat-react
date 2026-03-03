import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';

import { Badge } from '../Badge';

describe('Badge', () => {
  it('renders children', () => {
    render(<Badge>17</Badge>);
    expect(screen.getByText('17')).toBeInTheDocument();
  });

  it('applies variant class', () => {
    const { container } = render(<Badge variant='primary'>1</Badge>);
    expect(container.firstChild).toHaveClass('str-chat__badge--variant-primary');
  });

  it('applies size class', () => {
    const { container } = render(<Badge size='md'>1</Badge>);
    expect(container.firstChild).toHaveClass('str-chat__badge--size-md');
  });

  it('passes data-testid', () => {
    render(<Badge data-testid='custom-badge'>99</Badge>);
    expect(screen.getByTestId('custom-badge')).toHaveTextContent('99');
  });

  it('merges className', () => {
    const { container } = render(
      <Badge className='str-chat__jump-to-latest__unread-count'>5</Badge>,
    );
    expect(container.firstChild).toHaveClass('str-chat__badge');
    expect(container.firstChild).toHaveClass('str-chat__jump-to-latest__unread-count');
  });
});
