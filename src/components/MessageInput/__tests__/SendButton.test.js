import React from 'react';
import { render, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import SendButton from '../icons';

describe('SendButton', () => {
  it('should call whatever callback was passed into the sendMessage prop when the button is pressed', () => {
    const mock = jest.fn();
    const { getByTitle } = render(<SendButton sendMessage={mock} />);
    fireEvent.click(getByTitle('Send'));
    expect(mock).toHaveBeenCalledTimes(1);
  });
});
