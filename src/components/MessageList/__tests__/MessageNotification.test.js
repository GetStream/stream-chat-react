import React from 'react';
import { cleanup, fireEvent, render } from '@testing-library/react';
import '@testing-library/jest-dom';
import { toHaveNoViolations } from 'jest-axe';
import { axe } from '../../../../axe-helper';
expect.extend(toHaveNoViolations);

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

  it('should trigger onClick when clicked', async () => {
    const onClick = jest.fn();
    const { container, getByTestId } = render(
      <MessageNotification onClick={onClick} showNotification={true}>
        test
      </MessageNotification>,
    );
    fireEvent.click(getByTestId('message-notification'));
    expect(onClick).toHaveBeenCalledTimes(1);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('should display children', async () => {
    const onClick = jest.fn();
    const { container, getByText } = render(
      <MessageNotification onClick={onClick} showNotification={true}>
        test child
      </MessageNotification>,
    );
    expect(getByText('test child')).toBeInTheDocument();
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
