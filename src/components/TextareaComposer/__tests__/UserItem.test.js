import React from 'react';

import { cleanup, render } from '@testing-library/react';
import '@testing-library/jest-dom';
import { toHaveNoViolations } from 'jest-axe';
import { axe } from '../../../../axe-helper';
expect.extend(toHaveNoViolations);

import { UserItem } from '../SuggestionList';

afterEach(cleanup);

describe('UserItem', () => {
  it('should render component with default props', () => {
    const { container } = render(<UserItem entity={{}} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('should render username if provided', async () => {
    const { container, getByText } = render(
      <UserItem
        entity={{
          name: 'Frits Sissing',
          tokenizedDisplayName: { parts: ['Frits Sissin', 'g'], token: 'g' },
        }}
      />,
    );
    expect(getByText('Frits Sissin')).toBeInTheDocument();
    expect(getByText('g')).toBeInTheDocument();
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('should render profile picture if provided', async () => {
    const { container, getByTestId } = render(
      <UserItem
        entity={{
          id: '123',
          image: 'frits.jpg',
          name: 'Frits Sissing',
          tokenizedDisplayName: { parts: ['F', 'rits Sissing'], token: 'f' },
        }}
      />,
    );
    expect(getByTestId('avatar-img')).toHaveAttribute('src', 'frits.jpg');
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
