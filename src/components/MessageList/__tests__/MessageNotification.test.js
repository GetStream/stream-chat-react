import React from 'react';
import { cleanup, render, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';

import MessageNotification from '../MessageNotification';

afterEach(cleanup); // eslint-disable-line

describe('MessageNotification', () => {
  it('should render nothing if showNotification is false', () => {
    const { queryByTestId } = render(
      <MessageNotification showNotification={false} onClick={() => null}>
        test
      </MessageNotification>,
    );
    expect(queryByTestId('message-notification')).toBeNull();
  });

  it('should trigger onClick when clicked', () => {
    const onClick = jest.fn();
    const { getByTestId } = render(
      <MessageNotification showNotification={true} onClick={onClick}>
        test
      </MessageNotification>,
    );
    fireEvent.click(getByTestId('message-notification'));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('should display children', () => {
    const onClick = jest.fn();
    const { getByText } = render(
      <MessageNotification showNotification={true} onClick={onClick}>
        test child
      </MessageNotification>,
    );
    expect(getByText('test child')).toBeInTheDocument();
  });
});
