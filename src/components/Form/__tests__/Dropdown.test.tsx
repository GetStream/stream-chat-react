import React, { act } from 'react';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { Dropdown, type DropdownTriggerProps, useDropdownContext } from '../Dropdown';
import { GlobalModal, type ModalProps } from '../../Modal/GlobalModal';
import { ChatProvider, ModalDialogManagerProvider } from '../../../context';
import { mockChatContext } from '../../../mock-builders';

const TriggerButton = ({
  children,
  onClick,
  referenceRef,
  ...props
}: DropdownTriggerProps) => (
  <button
    {...props}
    data-testid='dropdown-trigger'
    onClick={onClick}
    ref={referenceRef as React.Ref<HTMLButtonElement>}
    type='button'
  >
    {children}
  </button>
);

const DropdownItem = ({ label }: { label: string }) => {
  const { close } = useDropdownContext();
  return (
    <button onClick={close} role='menuitem' type='button'>
      {label}
    </button>
  );
};

const renderDropdown = ({
  items = ['Item 1', 'Item 2', 'Item 3'],
  onClose,
  triggerLabel = 'Open',
}: {
  items?: string[];
  onClose?: () => void;
  triggerLabel?: string;
} = {}) =>
  render(
    <Dropdown
      onClose={onClose}
      TriggerComponent={TriggerButton}
      triggerProps={{ children: triggerLabel }}
    >
      {items.map((item) => (
        <DropdownItem key={item} label={item} />
      ))}
    </Dropdown>,
  );

const openDropdown = () => {
  fireEvent.click(screen.getByTestId('dropdown-trigger'));
  return screen.findByRole('menu');
};

describe('Dropdown', () => {
  afterEach(cleanup);

  it('renders the trigger and no menu initially', () => {
    renderDropdown();
    expect(screen.getByTestId('dropdown-trigger')).toBeInTheDocument();
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
  });

  it('opens menu on trigger click', async () => {
    renderDropdown();
    await openDropdown();
    expect(screen.getByRole('menu')).toBeInTheDocument();
    expect(screen.getAllByRole('menuitem')).toHaveLength(3);
  });

  it('closes on Escape keydown', async () => {
    const onClose = vi.fn();
    renderDropdown({ onClose });

    const menu = await openDropdown();
    const firstItem = screen.getByRole('menuitem', { name: 'Item 1' });
    firstItem.focus();

    fireEvent.keyDown(firstItem, { key: 'Escape' });

    await waitFor(() => {
      expect(screen.queryByRole('menu')).not.toBeInTheDocument();
    });
    expect(onClose).toHaveBeenCalledTimes(1);
    expect(menu).not.toBeInTheDocument();
  });

  it('calls preventDefault on Escape keydown so parent handlers can skip it', async () => {
    renderDropdown();

    await openDropdown();
    const firstItem = screen.getByRole('menuitem', { name: 'Item 1' });
    firstItem.focus();

    const event = new KeyboardEvent('keydown', {
      bubbles: true,
      cancelable: true,
      key: 'Escape',
    });
    const preventDefaultSpy = vi.spyOn(event, 'preventDefault');

    act(() => {
      firstItem.dispatchEvent(event);
    });

    expect(preventDefaultSpy).toHaveBeenCalled();
  });

  it('closes on click outside', async () => {
    renderDropdown();
    await openDropdown();

    fireEvent.mouseDown(document.body);

    await waitFor(() => {
      expect(screen.queryByRole('menu')).not.toBeInTheDocument();
    });
  });

  it('does not close on click inside the menu', async () => {
    renderDropdown();
    await openDropdown();

    const item = screen.getByRole('menuitem', { name: 'Item 2' });
    fireEvent.mouseDown(item);

    expect(screen.getByRole('menu')).toBeInTheDocument();
  });

  it('toggles closed when trigger is clicked again', async () => {
    renderDropdown();
    await openDropdown();

    fireEvent.click(screen.getByTestId('dropdown-trigger'));

    await waitFor(() => {
      expect(screen.queryByRole('menu')).not.toBeInTheDocument();
    });
  });
});

const renderDropdownInModal = ({
  modalProps,
  onClose,
}: {
  modalProps?: Partial<ModalProps>;
  onClose?: () => void;
} = {}) =>
  render(
    <ChatProvider value={mockChatContext({ theme: 'messaging light' })}>
      <ModalDialogManagerProvider>
        <GlobalModal aria-label='Test modal' onClose={onClose} open {...modalProps}>
          <div className='str-chat__modal__inner'>
            <Dropdown
              TriggerComponent={TriggerButton}
              triggerProps={{ children: 'Duration' }}
            >
              <DropdownItem label='15 minutes' />
              <DropdownItem label='1 hour' />
              <DropdownItem label='8 hours' />
            </Dropdown>
          </div>
        </GlobalModal>
      </ModalDialogManagerProvider>
    </ChatProvider>,
  );

describe('Dropdown inside GlobalModal', () => {
  afterEach(cleanup);

  it('Escape closes only the dropdown, not the modal', async () => {
    const onModalClose = vi.fn();
    renderDropdownInModal({ onClose: onModalClose });

    fireEvent.click(screen.getByTestId('dropdown-trigger'));
    await screen.findByRole('menu');

    const item = screen.getByRole('menuitem', { name: '15 minutes' });
    item.focus();

    fireEvent.keyDown(item, { key: 'Escape' });

    await waitFor(() => {
      expect(screen.queryByRole('menu')).not.toBeInTheDocument();
    });
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(onModalClose).not.toHaveBeenCalled();
  });

  it('Escape closes the modal when the dropdown is not open', () => {
    const onModalClose = vi.fn();
    renderDropdownInModal({ onClose: onModalClose });

    expect(screen.getByRole('dialog')).toBeInTheDocument();

    fireEvent.keyDown(screen.getByRole('dialog'), { key: 'Escape' });

    expect(onModalClose).toHaveBeenCalledTimes(1);
  });

  it('second Escape after closing dropdown closes the modal', async () => {
    const onModalClose = vi.fn();
    renderDropdownInModal({ onClose: onModalClose });

    fireEvent.click(screen.getByTestId('dropdown-trigger'));
    await screen.findByRole('menu');

    const item = screen.getByRole('menuitem', { name: '1 hour' });
    item.focus();

    fireEvent.keyDown(item, { key: 'Escape' });
    await waitFor(() => {
      expect(screen.queryByRole('menu')).not.toBeInTheDocument();
    });
    expect(onModalClose).not.toHaveBeenCalled();

    fireEvent.keyDown(screen.getByRole('dialog'), { key: 'Escape' });
    expect(onModalClose).toHaveBeenCalledTimes(1);
  });
});
