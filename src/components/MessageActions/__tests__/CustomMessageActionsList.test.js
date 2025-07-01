import React from 'react';
import { fireEvent, render } from '@testing-library/react';
import { CustomMessageActionsList } from '../CustomMessageActionsList';
import { act } from 'react';

describe('CustomMessageActionsList', () => {
  it('should render custom list of actions', () => {
    const message = { id: 'mId' };

    const actions = {
      key0: () => {},
      key1: () => {},
    };

    const { container } = render(
      <CustomMessageActionsList customMessageActions={actions} message={message} />,
    );

    expect(container).toMatchInlineSnapshot(`
      <div>
        <button
          aria-selected="false"
          class="str-chat__message-actions-list-item str-chat__message-actions-list-item-button"
          role="option"
        >
          key0
        </button>
        <button
          aria-selected="false"
          class="str-chat__message-actions-list-item str-chat__message-actions-list-item-button"
          role="option"
        >
          key1
        </button>
      </div>
    `);
  });

  it('should allow clicking custom action', () => {
    const message = { id: 'mId' };

    const actions = {
      key0: jest.fn(),
    };

    const { getByText } = render(
      <CustomMessageActionsList customMessageActions={actions} message={message} />,
    );

    const button = getByText('key0');

    const event = new Event('click', { bubbles: true });

    act(() => {
      fireEvent(button, event);
    });

    expect(actions.key0).toHaveBeenCalledWith(message, expect.any(Object)); // replacing SyntheticEvent with any(Object)
  });
});
