import React from 'react';
import '@testing-library/jest-dom';
import { fireEvent, render, waitFor } from '@testing-library/react';

import renderer from 'react-test-renderer';
import { v4 as uuidv4 } from 'uuid';
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
    const tree = renderer
      .create(
        getComponent({
          actionHandler: jest.fn(),
          actions,
          id: uuidv4(),
        }),
      )
      .toJSON();
    expect(tree).toMatchSnapshot();
  });
  it('should call actionHandler on click', async () => {
    const actionHandler = jest.fn();
    const { getByTestId } = render(
      getComponent({
        actionHandler,
        actions,
        id: uuidv4(),
      }),
    );

    await waitFor(() => {
      expect(getByTestId(actions[0].name)).toBeInTheDocument();
    });

    fireEvent.click(getByTestId(actions[0].name));
    fireEvent.click(getByTestId(actions[1].name));

    await waitFor(() => {
      // eslint-disable-next-line jest/prefer-called-with
      expect(actionHandler).toHaveBeenCalledTimes(2);
    });
  });
});
