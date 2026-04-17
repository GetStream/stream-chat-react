import React from 'react';
import { render, screen } from '@testing-library/react';
import { axe } from '../../../../axe-helper';

import { VisuallyHidden } from '../VisuallyHidden';

describe('VisuallyHidden', () => {
  it('renders children in the DOM with visually hidden styles', () => {
    render(<VisuallyHidden>Assistive text</VisuallyHidden>);

    const visuallyHiddenElement = screen.getByText('Assistive text');
    expect(visuallyHiddenElement).toBeInTheDocument();
    expect(visuallyHiddenElement).toHaveStyle({
      height: '1px',
      overflow: 'hidden',
      position: 'absolute',
      whiteSpace: 'nowrap',
      width: '1px',
    });
    expect(visuallyHiddenElement.style.clip).toBe('rect(0px, 0px, 0px, 0px)');
  });

  it('passes an axe accessibility check', async () => {
    const { container } = render(
      <div>
        <VisuallyHidden>Only visible to assistive tech</VisuallyHidden>
      </div>,
    );

    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
