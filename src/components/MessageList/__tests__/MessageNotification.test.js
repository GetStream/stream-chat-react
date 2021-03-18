import React from 'react';
import { cleanup, fireEvent, render } from '@testing-library/react';
import '@testing-library/jest-dom';

import { MessageNotification } from '../MessageNotification';

afterEach(cleanup); // eslint-disable-line

describe('MessageNotification', () => {
  it('should render nothing if showNotification is false', () => {
    const { queryByTestId } = render(
      <MessageNotification onClick={() => null} showNotification={false}>
        test
      </MessageNotification>,
    );
    expect(queryByTestId('message-notification')).not.toBeInTheDocument();
  });

  it('should trigger onClick when clicked', () => {
    const onClick = jest.fn();
    const { getByTestId } = render(
      <MessageNotification onClick={onClick} showNotification={true}>
        test
      </MessageNotification>,
    );
    fireEvent.click(getByTestId('message-notification'));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('should display children', () => {
    const onClick = jest.fn();
    const { getByText } = render(
      <MessageNotification onClick={onClick} showNotification={true}>
        test child
      </MessageNotification>,
    );
    expect(getByText('test child')).toBeInTheDocument();
  });
});
