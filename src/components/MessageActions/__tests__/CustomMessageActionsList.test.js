import React from 'react';
import { fireEvent, render } from '@testing-library/react';
import renderer from 'react-test-renderer';
import { CustomMessageActionsList } from '../CustomMessageActionsList';
import { act } from 'react';

describe('CustomMessageActionsList', () => {
  it('should render custom list of actions', () => {
    const message = { id: 'mId' };

    const actions = {
      key0: () => {},
      key1: () => {},
    };

    const tree = renderer.create(
      <CustomMessageActionsList customMessageActions={actions} message={message} />,
    );

    expect(tree.toJSON()).toMatchInlineSnapshot(`
      [
        <button
          aria-selected="false"
          className="str-chat__message-actions-list-item str-chat__message-actions-list-item-button"
          onClick={[Function]}
          role="option"
        >
          key0
        </button>,
        <button
          aria-selected="false"
          className="str-chat__message-actions-list-item str-chat__message-actions-list-item-button"
          onClick={[Function]}
          role="option"
        >
          key1
        </button>,
      ]
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
