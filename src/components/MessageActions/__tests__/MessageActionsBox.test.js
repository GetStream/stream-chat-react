import React from 'react';
import { render, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { generateMessage } from 'mock-builders';
import MessageActionsBox from '../MessageActionsBox';

const getMessageActionsMock = jest.fn(() => []);

const renderComponent = (props) =>
  render(
    <MessageActionsBox {...props} getMessageActions={getMessageActionsMock} />,
  );

describe('MessageActionsBox', () => {
  afterEach(jest.clearAllMocks);

  it('should not show any of the action buttons if no actions are returned by getMessageActions', () => {
    const { queryByText } = renderComponent();
    expect(queryByText('Flag')).not.toBeInTheDocument();
    expect(queryByText('Mute')).not.toBeInTheDocument();
    expect(queryByText('Unmute')).not.toBeInTheDocument();
    expect(queryByText('Edit Message')).not.toBeInTheDocument();
    expect(queryByText('Delete')).not.toBeInTheDocument();
    expect(queryByText('Pin')).not.toBeInTheDocument();
    expect(queryByText('Unpin')).not.toBeInTheDocument();
  });

  it('should call the handleFlag prop if the flag button is clicked', () => {
    getMessageActionsMock.mockImplementationOnce(() => ['flag']);
    const handleFlag = jest.fn();
    const { getByText } = renderComponent({ handleFlag });
    fireEvent.click(getByText('Flag'));
    expect(handleFlag).toHaveBeenCalledTimes(1);
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
