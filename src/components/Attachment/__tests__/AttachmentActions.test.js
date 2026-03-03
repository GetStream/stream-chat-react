import React from 'react';
import '@testing-library/jest-dom';
import { fireEvent, render, waitFor } from '@testing-library/react';

import { nanoid } from 'nanoid';
import { AttachmentActions } from '../AttachmentActions';

const getComponent = (props) => <AttachmentActions {...props} />;
const actions = [
  {
    name: 'action 1 name',
    text: 'action 1 text',
    value: 'action 1',
  },
  {
    name: 'action 2 name',
    text: 'action 2 text',
    value: 'action 2',
  },
];

describe('AttachmentActions', () => {
  it('should render AttachmentActions component', () => {
    const { container } = render(
      getComponent({
        actionHandler: jest.fn(),
        actions,
        id: nanoid(),
      }),
    );
    expect(container).toMatchSnapshot();
  });
  it('should call actionHandler on click', async () => {
    const actionHandler = jest.fn();
    const { getByTestId } = render(
      getComponent({
        actionHandler,
        actions,
        id: nanoid(),
      }),
    );

    await waitFor(() => {
      expect(getByTestId(actions[0].name)).toBeInTheDocument();
    });

    fireEvent.click(getByTestId(actions[0].name));
    fireEvent.click(getByTestId(actions[1].name));

    await waitFor(() => {
      expect(actionHandler).toHaveBeenCalledTimes(2);
    });
  });

  it('should focus default action by value', async () => {
    const { getByTestId } = render(
      getComponent({
        actions,
        defaultFocusedActionValue: actions[1].value,
        id: nanoid(),
      }),
    );

    await waitFor(() => {
      expect(getByTestId(actions[1].name)).toHaveFocus();
    });
  });
});
