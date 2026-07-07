import React from 'react';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';

import { GlobalModal } from '../GlobalModal';
import { ContextMenu, ContextMenuButton, useDialogOnNearestManager } from '../../Dialog';
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

const ModalContextMenu = () => {
  const [referenceElement, setReferenceElement] =
    React.useState<HTMLButtonElement | null>(null);
  const { dialog, dialogManager } = useDialogOnNearestManager({
    id: 'modal-context-menu',
  });

  return (
    <>
      <button onClick={() => dialog.open()} ref={setReferenceElement} type='button'>
        Open context menu
      </button>
      <ContextMenu
        aria-label='Modal context menu'
        dialogManagerId={dialogManager?.id}
        id={dialog.id}
        onClose={dialog.close}
        placement='bottom-start'
        referenceElement={referenceElement}
        tabIndex={-1}
        trapFocus
      >
        <ContextMenuButton>Menu action</ContextMenuButton>
      </ContextMenu>
    </>
  );
};

const renderStackedModals = ({
  childOnClose = vi.fn(),
  parentOnClose = vi.fn(),
}: {
  childOnClose?: () => void;
  parentOnClose?: () => void;
} = {}) =>
  render(
    <ChatProvider value={mockChatContext({ theme: 'messaging light' })}>
      <ComponentProvider value={{ NotificationList: NoopNotificationList }}>
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
      </ComponentProvider>
    </ChatProvider>,
  );

const RemovableChildModalFixture = () => {
  const [showChild, setShowChild] = React.useState(true);

  return (
    <ChatProvider value={mockChatContext({ theme: 'messaging light' })}>
      <ComponentProvider value={{ NotificationList: NoopNotificationList }}>
        <ModalDialogManagerProvider>
          <GlobalModal aria-label='Parent modal' open>
            <ModalContent text='Parent content' />
            {showChild && (
              <GlobalModal aria-label='Child modal' open role='alertdialog'>
                <ModalContent text='Child content'>
                  <button onClick={() => setShowChild(false)} type='button'>
                    Remove child modal
                  </button>
                </ModalContent>
              </GlobalModal>
            )}
          </GlobalModal>
        </ModalDialogManagerProvider>
      </ComponentProvider>
    </ChatProvider>
  );
};

const CloseChildModalFixture = () => {
  const [childOpen, setChildOpen] = React.useState(true);

  return (
    <ChatProvider value={mockChatContext({ theme: 'messaging light' })}>
      <ComponentProvider value={{ NotificationList: NoopNotificationList }}>
        <ModalDialogManagerProvider>
          <GlobalModal aria-label='Parent modal' open>
            <ModalContent text='Parent content' />
            <GlobalModal aria-label='Child modal' open={childOpen} role='alertdialog'>
              <ModalContent text='Child content'>
                <button onClick={() => setChildOpen(false)} type='button'>
                  Close child modal
                </button>
              </ModalContent>
            </GlobalModal>
          </GlobalModal>
        </ModalDialogManagerProvider>
      </ComponentProvider>
    </ChatProvider>
  );
};

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

  it('moves focus to the [data-autofocus] field when Enter is pressed on the dialog surface', () => {
    renderComponent({
      props: {
        children: (
          <ModalContent text='content'>
            <input data-autofocus data-testid='default-field' />
          </ModalContent>
        ),
        initialFocusStrategy: 'dialog',
        open: true,
      },
    });

    const dialog = screen.getByRole('dialog');
    fireEvent.keyDown(dialog, { key: 'Enter', target: dialog });

    expect(screen.getByTestId('default-field')).toHaveFocus();
  });

  it('ignores Enter that bubbles up from a control inside the dialog', () => {
    renderComponent({
      props: {
        children: (
          <ModalContent text='content'>
            <input data-autofocus data-testid='default-field' />
            <input data-testid='other-field' />
          </ModalContent>
        ),
        initialFocusStrategy: 'dialog',
        open: true,
      },
    });

    const other = screen.getByTestId('other-field');
    other.focus();
    // Enter originating from another field must not yank focus to the default field.
    fireEvent.keyDown(other, { key: 'Enter' });

    expect(other).toHaveFocus();
    expect(screen.getByTestId('default-field')).not.toHaveFocus();
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
    expect(dialog).toHaveAttribute('tabindex', '0');
    expect(dialog).toHaveAttribute('aria-labelledby', 'modal-title');
    expect(dialog).toHaveAttribute('aria-describedby', 'modal-description');
  });

  it('forwards dialogRootProps to the dialog surface', () => {
    renderComponent({
      props: {
        'aria-label': 'Modal label',
        children: <ModalContent text={textContent} />,
        dialogRootProps: {
          className: 'custom-dialog',
          'data-testid': 'dialog-root',
        },
        open: true,
      },
    });

    const dialog = screen.getByRole('dialog', { name: 'Modal label' });

    expect(dialog).toBe(screen.getByTestId('dialog-root'));
    expect(dialog).toHaveClass('str-chat__modal__dialog');
    expect(dialog).toHaveClass('custom-dialog');
  });

  it('lets dialogRootProps onKeyDown prevent the internal escape close', () => {
    const onClose = vi.fn();
    const onKeyDown = vi.fn((event: React.KeyboardEvent<HTMLDivElement>) => {
      event.preventDefault();
    });

    renderComponent({
      props: {
        'aria-label': 'Modal label',
        children: <ModalContent text={textContent} />,
        dialogRootProps: { onKeyDown },
        onClose,
        open: true,
      },
    });

    fireEvent.keyDown(screen.getByRole('dialog', { name: 'Modal label' }), {
      key: 'Escape',
    });

    expect(onKeyDown).toHaveBeenCalledTimes(1);
    expect(onClose).not.toHaveBeenCalled();
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
    expect(parentModal).toHaveAttribute('tabindex', '-1');
    expect(childModal).toBeInTheDocument();
    expect(childModal).toHaveAttribute('aria-modal', 'true');
    expect(childModal).not.toHaveAttribute('inert');
    expect(childModal).toHaveAttribute('tabindex', '0');
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

  it('restores interactivity to the underlying modal after the topmost modal closes', () => {
    const childOnClose = vi.fn();
    const parentOnClose = vi.fn();

    renderStackedModals({ childOnClose, parentOnClose });

    const parentModal = screen.getByRole('dialog', { name: 'Parent modal' });
    const childModal = screen.getByRole('alertdialog', { name: 'Child modal' });

    fireEvent.keyDown(childModal, { key: 'Escape' });

    expect(childOnClose).toHaveBeenCalledTimes(1);
    expect(parentModal).toHaveAttribute('aria-modal', 'true');
    expect(parentModal).not.toHaveAttribute('inert');
    expect(parentModal).toHaveAttribute('tabindex', '0');

    fireEvent.keyDown(parentModal, { key: 'Escape' });

    expect(parentOnClose).toHaveBeenCalledTimes(1);
  });

  it('restores topmost state to the underlying modal after the topmost modal is removed', () => {
    render(<RemovableChildModalFixture />);

    const parentModal = screen.getByRole('dialog', { name: 'Parent modal' });
    expect(parentModal).toHaveAttribute('tabindex', '-1');

    fireEvent.click(screen.getByRole('button', { name: 'Remove child modal' }));

    expect(
      screen.queryByRole('alertdialog', { name: 'Child modal' }),
    ).not.toBeInTheDocument();
    expect(parentModal).toHaveAttribute('aria-modal', 'true');
    expect(parentModal).not.toHaveAttribute('inert');
    expect(parentModal).toHaveAttribute('tabindex', '0');
  });

  it('restores topmost state to the underlying modal after the topmost modal open prop becomes false', () => {
    render(<CloseChildModalFixture />);

    const parentModal = screen.getByRole('dialog', { name: 'Parent modal' });
    expect(parentModal).toHaveAttribute('tabindex', '-1');

    fireEvent.click(screen.getByRole('button', { name: 'Close child modal' }));

    expect(
      screen.queryByRole('alertdialog', { name: 'Child modal' }),
    ).not.toBeInTheDocument();
    expect(parentModal).toHaveAttribute('aria-modal', 'true');
    expect(parentModal).not.toHaveAttribute('inert');
    expect(parentModal).toHaveAttribute('tabindex', '0');
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

  it('closes a context menu rendered above the modal without closing or demoting the modal', async () => {
    renderComponent({
      props: {
        'aria-label': 'Modal with context menu',
        children: (
          <ModalContent text={textContent}>
            <ModalContextMenu />
          </ModalContent>
        ),
        open: true,
      },
    });

    const modal = screen.getByRole('dialog', { name: 'Modal with context menu' });
    expect(modal).toHaveAttribute('aria-modal', 'true');

    fireEvent.click(screen.getByRole('button', { name: 'Open context menu' }));

    expect(
      await screen.findByRole('menu', { name: 'Modal context menu' }),
    ).toBeInTheDocument();
    expect(modal).toHaveAttribute('aria-modal', 'true');
    expect(modal).not.toHaveAttribute('inert');

    const floatingOverlay = document.querySelector(
      '.str-chat__modal__floating-dialog-overlay',
    );
    expect(floatingOverlay).toBeInTheDocument();

    fireEvent.click(floatingOverlay as Element);

    await waitFor(() => {
      expect(
        screen.queryByRole('menu', { name: 'Modal context menu' }),
      ).not.toBeInTheDocument();
    });

    expect(
      screen.getByRole('dialog', { name: 'Modal with context menu' }),
    ).toHaveAttribute('aria-modal', 'true');
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
