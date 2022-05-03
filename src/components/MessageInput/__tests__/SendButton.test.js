import React from 'react';
import { fireEvent, render } from '@testing-library/react';
import '@testing-library/jest-dom';
import { toHaveNoViolations } from 'jest-axe';
import { axe } from '../../../../axe-helper';
expect.extend(toHaveNoViolations);

import { SendButton } from '../icons';

describe('SendButton', () => {
  it('should call whatever callback was passed into the sendMessage prop when the button is pressed', async () => {
    const mock = jest.fn();
    const { container, getByTitle } = render(<SendButton sendMessage={mock} />);
    fireEvent.click(getByTitle('Send'));
    expect(mock).toHaveBeenCalledTimes(1);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
