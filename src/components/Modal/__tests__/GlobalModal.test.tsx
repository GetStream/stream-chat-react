import React from 'react';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';

import { GlobalModal } from '../GlobalModal';
import {
  ChatProvider,
  ComponentProvider,
  ModalDialogManagerProvider,
} from '../../../context';
import { mockChatContext } from '../../../mock-builders';
import { axe } from '../../../../axe-helper';

import type { NotificationListProps } from '../../Notifications';

const OVERLAY_SELECTOR = '.str-chat__modal';

const NoopNotificationList: React.ComponentType<NotificationListProps> = () => null;
const renderComponent = ({
  components,
  props,
}: {
  components?: React.ComponentProps<typeof ComponentProvider>['value'];
  props?: React.ComponentProps<typeof GlobalModal>;
} = {}) =>
  render(
    <ChatProvider value={mockChatContext({ theme: 'messaging light' })}>
      <ComponentProvider
        value={{ NotificationList: NoopNotificationList, ...components }}
      >
        <ModalDialogManagerProvider>
          <GlobalModal open={false} {...props} />
        </ModalDialogManagerProvider>
      </ComponentProvider>
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

const renderStackedModals = ({
  childOnClose = vi.fn(),
  parentOnClose = vi.fn(),
}: {
  childOnClose?: () => void;
  parentOnClose?: () => void;
} = {}) =>
  render(
    <ChatProvider value={mockChatContext({ theme: 'messaging light' })}>
      <ModalDialogManagerProvider>
        <GlobalModal aria-label='Parent modal' onClose={parentOnClose} open>
          <ModalContent text='Parent content' />
          <GlobalModal
            aria-label='Child modal'
            onClose={childOnClose}
            open
            role='alertdialog'
          >
            <ModalContent text='Child content' />
          </GlobalModal>
        </GlobalModal>
      </ModalDialogManagerProvider>
    </ChatProvider>,
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

  it('renders notifications relative to the modal overlay', () => {
    const ModalNotificationList = ({
      className,
      panel,
      verticalAlignment,
    }: NotificationListProps) => (
      <div
        className={className}
        data-panel={panel}
        data-testid='modal-notification-list'
        data-vertical-alignment={verticalAlignment}
      />
    );

    renderComponent({
      components: { NotificationList: ModalNotificationList },
      props: { children: <ModalContent text={textContent} />, open: true },
    });

    const notificationList = screen.getByTestId('modal-notification-list');

    expect(notificationList).toHaveClass('str-chat__modal__notification-list');
    expect(notificationList).toHaveAttribute('data-panel', 'modal');
    expect(notificationList).toHaveAttribute('data-vertical-alignment', 'top');
    expect(document.querySelector(OVERLAY_SELECTOR)).toContainElement(notificationList);
    expect(screen.getByRole('dialog')).not.toContainElement(notificationList);
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
            <h2 id='custom-modal-title'>Autogenerated title target</h2>
          </ModalContent>
        ),
        dialogId: 'custom-modal',
        open: true,
      },
    });

    const dialog = screen.getByRole('dialog', { name: 'Autogenerated title target' });
    expect(dialog).toHaveAttribute('aria-labelledby', 'custom-modal-title');
    expect(dialog).not.toHaveAttribute('aria-label');
  });

  it('autowires aria-describedby when not explicitly provided', () => {
    renderComponent({
      props: {
        children: (
          <ModalContent text={textContent}>
            <h2 id='custom-modal-title'>Create poll</h2>
            <p id='custom-modal-description'>Create poll description</p>
          </ModalContent>
        ),
        dialogId: 'custom-modal',
        open: true,
      },
    });

    const dialog = screen.getByRole('dialog', { name: 'Create poll' });
    expect(dialog).toHaveAttribute('aria-labelledby', 'custom-modal-title');
    expect(dialog).toHaveAttribute('aria-describedby', 'custom-modal-description');
  });

  it('autowires aria-describedby for alertdialog when not explicitly provided', () => {
    renderComponent({
      props: {
        children: (
          <ModalContent text={textContent}>
            <h2 id='delete-message-alert-title'>Delete message</h2>
            <p id='delete-message-alert-description'>Are you sure?</p>
          </ModalContent>
        ),
        dialogId: 'delete-message-alert',
        open: true,
        role: 'alertdialog',
      },
    });

    const dialog = screen.getByRole('alertdialog', { name: 'Delete message' });
    expect(dialog).toHaveAttribute('aria-labelledby', 'delete-message-alert-title');
    expect(dialog).toHaveAttribute(
      'aria-describedby',
      'delete-message-alert-description',
    );
  });

  it('supports rendering an alertdialog above an existing modal', () => {
    renderStackedModals();

    const parentModal = screen.getByRole('dialog', { name: 'Parent modal' });
    const childModal = screen.getByRole('alertdialog', { name: 'Child modal' });

    expect(parentModal).toBeInTheDocument();
    expect(parentModal).not.toHaveAttribute('aria-modal');
    expect(parentModal).toHaveAttribute('inert');
    expect(childModal).toBeInTheDocument();
    expect(childModal).toHaveAttribute('aria-modal', 'true');
    expect(childModal).not.toHaveAttribute('inert');
  });

  it('only closes the topmost modal on Escape', () => {
    const childOnClose = vi.fn();
    const parentOnClose = vi.fn();

    renderStackedModals({ childOnClose, parentOnClose });

    fireEvent.keyDown(screen.getByRole('dialog', { name: 'Parent modal' }), {
      key: 'Escape',
    });
    expect(parentOnClose).not.toHaveBeenCalled();

    fireEvent.keyDown(screen.getByRole('alertdialog', { name: 'Child modal' }), {
      key: 'Escape',
    });
    expect(childOnClose).toHaveBeenCalledTimes(1);
    expect(parentOnClose).not.toHaveBeenCalled();
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
});
