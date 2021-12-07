import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { axe, toHaveNoViolations } from 'jest-axe';
expect.extend(toHaveNoViolations);

import { MessageActionsBox } from '../MessageActionsBox';

import { MessageProvider } from '../../../context/MessageContext';

import { generateMessage } from '../../../mock-builders';

const getMessageActionsMock = jest.fn(() => []);

const messageContextValue = {
  message: generateMessage(),
  messageListRect: {},
};

function renderComponent(boxProps) {
  return render(
    <MessageProvider value={{ ...messageContextValue, message: boxProps.message }}>
      <MessageActionsBox {...boxProps} getMessageActions={getMessageActionsMock} />
    </MessageProvider>,
  );
}

describe('MessageActionsBox', () => {
  afterEach(jest.clearAllMocks);

  it('should not show any of the action buttons if no actions are returned by getMessageActions', () => {
    const { queryByText } = renderComponent({});
    expect(queryByText('Flag')).not.toBeInTheDocument();
    expect(queryByText('Mute')).not.toBeInTheDocument();
    expect(queryByText('Unmute')).not.toBeInTheDocument();
    expect(queryByText('Edit Message')).not.toBeInTheDocument();
    expect(queryByText('Delete')).not.toBeInTheDocument();
    expect(queryByText('Pin')).not.toBeInTheDocument();
    expect(queryByText('Unpin')).not.toBeInTheDocument();
  });

  it('should call the handleFlag prop if the flag button is clicked', async () => {
    getMessageActionsMock.mockImplementationOnce(() => ['flag']);
    const handleFlag = jest.fn();
    const { container, getByText } = renderComponent({ handleFlag });
    fireEvent.click(getByText('Flagg'));
    expect(handleFlag).toHaveBeenCalledTimes(1);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
    screen.debug();
    console.log(
      '*********',
      results.passes.map((r) => r.id),
    );
  });

  it('should call the handleMute prop if the mute button is clicked', () => {
    getMessageActionsMock.mockImplementationOnce(() => ['mute']);
    const handleMute = jest.fn();
    const { getByText } = renderComponent({
      handleMute,
      isUserMuted: () => false,
    });
    fireEvent.click(getByText('Mute'));
    expect(handleMute).toHaveBeenCalledTimes(1);
  });

  it('should call the handleMute prop if the unmute button is clicked', () => {
    getMessageActionsMock.mockImplementationOnce(() => ['mute']);
    const handleMute = jest.fn();
    const { getByText } = renderComponent({
      handleMute,
      isUserMuted: () => true,
    });
    fireEvent.click(getByText('Unmute'));
    expect(handleMute).toHaveBeenCalledTimes(1);
  });

  it('should call the handleEdit prop if the edit button is clicked', () => {
    getMessageActionsMock.mockImplementationOnce(() => ['edit']);
    const handleEdit = jest.fn();
    const { getByText } = renderComponent({ handleEdit });
    fireEvent.click(getByText('Edit Message'));
    expect(handleEdit).toHaveBeenCalledTimes(1);
  });

  it('should call the handleDelete prop if the delete button is clicked', () => {
    getMessageActionsMock.mockImplementationOnce(() => ['delete']);
    const handleDelete = jest.fn();
    const { getByText } = renderComponent({ handleDelete });
    fireEvent.click(getByText('Delete'));
    expect(handleDelete).toHaveBeenCalledTimes(1);
  });

  it('should call the handlePin prop if the pin button is clicked', () => {
    getMessageActionsMock.mockImplementationOnce(() => ['pin']);
    const handlePin = jest.fn();
    const message = generateMessage({ pinned: false });
    const { getByText } = renderComponent({ handlePin, message });
    fireEvent.click(getByText('Pin'));
    expect(handlePin).toHaveBeenCalledTimes(1);
  });

  it('should call the handlePin prop if the unpin button is clicked', () => {
    getMessageActionsMock.mockImplementationOnce(() => ['pin']);
    const handlePin = jest.fn();
    const message = generateMessage({ pinned: true });
    const { getByText } = renderComponent({ handlePin, message });
    fireEvent.click(getByText('Unpin'));
    expect(handlePin).toHaveBeenCalledTimes(1);
  });
});
