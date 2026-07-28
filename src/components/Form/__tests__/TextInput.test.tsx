import React from 'react';
import { render, screen } from '@testing-library/react';

import { axe } from '../../../../axe-helper';
import { TextInput } from '../TextInput';

describe('TextInput', () => {
  it('keeps interactive trailing content in the accessibility tree', () => {
    render(
      <TextInput
        aria-label='Poll option'
        trailing={<button aria-label='Remove option'>Remove</button>}
      />,
    );

    const trailingButton = screen.getByRole('button', { name: 'Remove option' });

    expect(trailingButton).toBeInTheDocument();
    expect(trailingButton.closest('[aria-hidden="true"]')).toBeNull();
  });

  it('passes axe checks with interactive trailing content', async () => {
    const { container } = render(
      <TextInput
        aria-label='Poll option'
        trailing={<button aria-label='Remove option'>Remove</button>}
      />,
    );

    const results = await axe(container);

    expect(results).toHaveNoViolations();
  });
});
