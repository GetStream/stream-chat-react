import React from 'react';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';

import { GlobalModal } from '../GlobalModal';
import { ChatProvider, ModalDialogManagerProvider } from '../../../context';
import { mockChatContext } from '../../../mock-builders';
import { axe } from '../../../../axe-helper';

const OVERLAY_SELECTOR = '.str-chat__modal';
const renderComponent = ({ props }: any = {}) =>
  render(
    <ChatProvider value={mockChatContext({ theme: 'messaging light' })}>
      <ModalDialogManagerProvider>
        <GlobalModal {...props} />
      </ModalDialogManagerProvider>
    </ChatProvider>,
  );

// Wrap children in a focusable element so FocusScope can manage focus
const ModalContent = ({
  children,
  text,
}: {
  children?: React.ReactNode;
  text: string;
}) => (
  <div className='str-chat__modal__inner'>
    <button type='button'>{text}</button>
    {children}
  </div>
);

const OverlayCloseButton = React.forwardRef<
  HTMLButtonElement,
  React.ComponentProps<'button'>
>(function OverlayCloseButton(props, ref) {
  return (
    <button {...props} aria-label='Close overlay' ref={ref} type='button'>
      Close
    </button>
  );
});

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

    fireEvent.keyDown(screen.getByRole('dialog'), { key: 'Escape' });

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('should remove the escape keydown event handler when unmounted', () => {
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
    // Click inside modal content, not the overlay root.
    fireEvent.click(screen.getByRole('button', { name: textContent }));

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

  it('should call onClose if the overlay close button is clicked', () => {
    const onClose = vi.fn();
    renderComponent({
      props: {
        children: <ModalContent text={textContent} />,
        CloseButtonOnOverlay: OverlayCloseButton,
        onClose,
        open: true,
      },
    });

    fireEvent.click(screen.getByRole('button', { name: 'Close overlay' }));

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

    fireEvent.keyDown(screen.getByRole('dialog'), { key: 'Escape' });

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

    fireEvent.keyDown(screen.getByRole('dialog'), { key: 'Escape' });

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

  it('forwards modal labeling props to the dialog surface', () => {
    renderComponent({
      props: {
        'aria-describedby': 'modal-description',
        'aria-labelledby': 'modal-title',
        children: (
          <ModalContent text={textContent}>
            <h2 id='modal-title'>Dialog title</h2>
            <p id='modal-description'>Dialog description</p>
          </ModalContent>
        ),
        open: true,
      },
    });

    const dialog = screen.getByRole('dialog');
    expect(dialog).toHaveClass('str-chat__modal__dialog');
    expect(dialog).toHaveAttribute('aria-modal', 'true');
    expect(dialog).toHaveAttribute('tabindex', '-1');
    expect(dialog).toHaveAttribute('aria-labelledby', 'modal-title');
    expect(dialog).toHaveAttribute('aria-describedby', 'modal-description');
  });

  it('falls back to aria-label when aria-labelledby is not provided', () => {
    renderComponent({
      props: {
        'aria-label': 'Fallback modal label',
        children: <ModalContent text={textContent} />,
        open: true,
      },
    });

    const dialog = screen.getByRole('dialog', { name: 'Fallback modal label' });
    expect(dialog).toHaveAttribute('aria-modal', 'true');
    expect(dialog).not.toHaveAttribute('aria-labelledby');
  });

  it('autowires aria-labelledby from modal dialog root id when no explicit label is provided', () => {
    renderComponent({
      props: {
        children: (
          <ModalContent text={textContent}>
            <h2 id='modal-dialog-title'>Autogenerated title target</h2>
          </ModalContent>
        ),
        open: true,
      },
    });

    const dialog = screen.getByRole('dialog', { name: 'Autogenerated title target' });
    expect(dialog).toHaveAttribute('aria-labelledby', 'modal-dialog-title');
    expect(dialog).not.toHaveAttribute('aria-label');
  });

  it('autowires aria-describedby when not explicitly provided', () => {
    renderComponent({
      props: {
        children: (
          <ModalContent text={textContent}>
            <h2 id='modal-dialog-title'>Create poll</h2>
            <p id='modal-dialog-description'>Create poll description</p>
          </ModalContent>
        ),
        open: true,
      },
    });

    const dialog = screen.getByRole('dialog', { name: 'Create poll' });
    expect(dialog).toHaveAttribute('aria-labelledby', 'modal-dialog-title');
    expect(dialog).toHaveAttribute('aria-describedby', 'modal-dialog-description');
  });

  it('autowires aria-describedby for alertdialog when not explicitly provided', () => {
    renderComponent({
      props: {
        children: (
          <ModalContent text={textContent}>
            <h2 id='modal-dialog-title'>Delete message</h2>
            <p id='modal-dialog-description'>Are you sure?</p>
          </ModalContent>
        ),
        open: true,
        role: 'alertdialog',
      },
    });

    const dialog = screen.getByRole('alertdialog', { name: 'Delete message' });
    expect(dialog).toHaveAttribute('aria-labelledby', 'modal-dialog-title');
    expect(dialog).toHaveAttribute('aria-describedby', 'modal-dialog-description');
  });

  it('forwards alertdialog role when explicitly provided', () => {
    renderComponent({
      props: {
        'aria-label': 'Delete confirmation',
        children: <ModalContent text={textContent} />,
        open: true,
        role: 'alertdialog',
      },
    });

    const dialog = screen.getByRole('alertdialog', { name: 'Delete confirmation' });
    expect(dialog).toHaveClass('str-chat__modal__dialog');
    expect(dialog).toHaveAttribute('aria-modal', 'true');
  });

  it('has no accessibility violations for modal semantics', async () => {
    renderComponent({
      props: {
        'aria-label': 'Accessible modal',
        children: <ModalContent text={textContent} />,
        open: true,
      },
    });

    const results = await axe(document.body);
    expect(results).toHaveNoViolations();
  });

  it('can focus the dialog surface on open when requested', () => {
    renderComponent({
      props: {
        'aria-label': 'Focused dialog',
        children: <ModalContent text={textContent} />,
        initialFocusStrategy: 'dialog',
        open: true,
      },
    });

    return waitFor(() => {
      expect(screen.getByRole('dialog', { name: 'Focused dialog' })).toHaveFocus();
    });
  });

  it('can focus a custom element on open when requested', () => {
    renderComponent({
      props: {
        'aria-label': 'Custom focused dialog',
        children: (
          <div className='str-chat__modal__inner'>
            <button id='first-button' type='button'>
              First
            </button>
            <button id='second-button' type='button'>
              Second
            </button>
          </div>
        ),
        getInitialFocusElement: (dialogElement) =>
          dialogElement.querySelector('#second-button'),
        open: true,
      },
    });

    return waitFor(() => {
      expect(screen.getByRole('button', { name: 'Second' })).toHaveFocus();
    });
  });
});
