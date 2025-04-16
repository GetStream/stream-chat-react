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
    expect(container).toMatchInlineSnapshot(`
      <div>
        <div
          class="str-chat__user-item"
        >
          <div
            class="str-chat__avatar str-chat__message-sender-avatar str-chat__avatar--autocomplete-item str-chat__avatar--no-letters"
            data-testid="avatar"
            role="button"
          >
            <svg
              class="str-chat__icon str-chat__icon--user"
              fill="none"
              height="16"
              viewBox="0 0 16 16"
              width="16"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M8 2C9.1 2 10 2.9 10 4C10 5.1 9.1 6 8 6C6.9 6 6 5.1 6 4C6 2.9 6.9 2 8 2ZM8 12C10.7 12 13.8 13.29 14 14H2C2.23 13.28 5.31 12 8 12ZM8 0C5.79 0 4 1.79 4 4C4 6.21 5.79 8 8 8C10.21 8 12 6.21 12 4C12 1.79 10.21 0 8 0ZM8 10C5.33 10 0 11.34 0 14V16H16V14C16 11.34 10.67 10 8 10Z"
                fill="currentColor"
              />
            </svg>
          </div>
          <span
            class="str-chat__user-item--name"
            data-testid="user-item-name"
          />
          <div
            class="str-chat__user-item-at"
          >
            @
          </div>
        </div>
      </div>
    `);
  });

  it('should render username if provided', async () => {
    const { container, getByText } = render(
      <UserItem
        entity={{
          itemNameParts: { match: 'g', parts: ['Frits Sissin', 'g'] },
          name: 'Frits Sissing',
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
          itemNameParts: { match: 'f', parts: ['F', 'rits Sissing'] },
          name: 'Frits Sissing',
        }}
      />,
    );
    expect(getByTestId('avatar-img')).toHaveAttribute('src', 'frits.jpg');
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
