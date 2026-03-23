import React from 'react';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';

import { GlobalModal } from '../GlobalModal';
import { ChatProvider, ModalDialogManagerProvider } from '../../../context';

const OVERLAY_SELECTOR = '.str-chat__modal';
const renderComponent = ({ props } = {}) =>
  render(
    <ChatProvider value={{ theme: 'messaging light' }}>
      <ModalDialogManagerProvider>
        <GlobalModal {...props} />
      </ModalDialogManagerProvider>
    </ChatProvider>,
  );

// Wrap children in a focusable element so FocusScope can manage focus
const ModalContent = ({ text }) => (
  <div className='str-chat__modal__inner' role='dialog'>
    <button type='button'>{text}</button>
  </div>
);

describe('GlobalModal', () => {
  const textContent = 'some text';
  afterEach(cleanup);

  it('should be closed (null) if the `open` prop is set to false', () => {
    const { container } = renderComponent({ props: { open: false } });

    expect(container.querySelector(OVERLAY_SELECTOR)).not.toBeInTheDocument();
  });

  it('should be open if the `open` prop is set to true', () => {
    const { container } = renderComponent({
      props: { children: <ModalContent text={textContent} />, open: true },
    });

    expect(container.querySelector('.str-chat__modal--open')).toBeInTheDocument();
  });

  it('should render what is passed as props.children when opened', () => {
    const { queryByText } = renderComponent({
      props: { children: <ModalContent text={textContent} />, open: true },
    });

    expect(queryByText(textContent)).toBeInTheDocument();
  });

  it('should call the onClose prop function if the escape key is pressed', () => {
    const onClose = vi.fn();
    renderComponent({
      props: { children: <ModalContent text='content' />, onClose, open: true },
    });

    fireEvent(
      document,
      new KeyboardEvent('keydown', {
        key: 'Escape',
      }),
    );

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('should remove the escape keydown event handler on unmount', () => {
    const onClose = vi.fn();
    const { unmount } = renderComponent({
      props: { children: <ModalContent text='content' />, onClose, open: true },
    });

    unmount();
    fireEvent(
      document,
      new KeyboardEvent('keydown', {
        key: 'Escape',
      }),
    );

    expect(onClose).not.toHaveBeenCalled();
  });

  it('should not call onClose if the inside of the modal was clicked', () => {
    const onClose = vi.fn();
    renderComponent({
      props: {
        children: <ModalContent text={textContent} />,
        onClose,
        open: true,
      },
    });
    // Click on the inner dialog div, not the overlay
    const innerDialog = screen.getByRole('dialog');
    fireEvent.click(innerDialog);

    expect(onClose).not.toHaveBeenCalled();
  });

  it('should call onClose if the modal overlay is clicked', () => {
    const onClose = vi.fn();
    const { container } = renderComponent({
      props: {
        children: <ModalContent text={textContent} />,
        onClose,
        open: true,
      },
    });

    const dialogOverlay = container.querySelector('.str-chat__modal');

    fireEvent.click(dialogOverlay);

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('should call onClose if onCloseAttempt returns true and Escape pressed', () => {
    const onClose = vi.fn();
    const onCloseAttempt = () => true;
    renderComponent({
      props: {
        children: <ModalContent text={textContent} />,
        onClose,
        onCloseAttempt,
        open: true,
      },
    });

    fireEvent(
      document,
      new KeyboardEvent('keydown', {
        key: 'Escape',
      }),
    );

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('should call onClose if onCloseAttempt returns true and overlay clicked', () => {
    const onClose = vi.fn();
    const onCloseAttempt = () => true;
    const { container } = renderComponent({
      props: {
        children: <ModalContent text={textContent} />,
        onClose,
        onCloseAttempt,
        open: true,
      },
    });

    fireEvent.click(container.querySelector(OVERLAY_SELECTOR));

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('should not call onClose if onCloseAttempt returns false and Escape pressed', () => {
    const onClose = vi.fn();
    const onCloseAttempt = () => false;
    renderComponent({
      props: {
        children: <ModalContent text={textContent} />,
        onClose,
        onCloseAttempt,
        open: true,
      },
    });

    fireEvent(
      document,
      new KeyboardEvent('keydown', {
        key: 'Escape',
      }),
    );

    expect(onClose).not.toHaveBeenCalled();
  });

  it('should not call onClose if onCloseAttempt returns false and overlay clicked', () => {
    const onClose = vi.fn();
    const onCloseAttempt = () => false;
    const { container } = renderComponent({
      props: {
        children: <ModalContent text={textContent} />,
        onClose,
        onCloseAttempt,
        open: true,
      },
    });

    fireEvent.click(container.querySelector(OVERLAY_SELECTOR));

    expect(onClose).not.toHaveBeenCalled();
  });
});
