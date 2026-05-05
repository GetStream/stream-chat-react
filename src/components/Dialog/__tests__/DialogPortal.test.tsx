import React from 'react';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import {
  Dropdown,
  type DropdownTriggerProps,
  useDropdownContext,
} from '../../Form/Dropdown';
import { useDialogOnNearestManager } from '../hooks';
import { DialogAnchor } from '../service';
import { DialogManagerProvider } from '../../../context';
import { axe } from '../../../../axe-helper';

const DialogFixture = ({
  children,
  dialogId,
  testId,
  ...dialogAnchorProps
}: {
  children?: React.ReactNode;
  dialogId: string;
  testId: string;
} & Partial<React.ComponentProps<typeof DialogAnchor>>) => {
  const { dialog } = useDialogOnNearestManager({ id: dialogId });

  return (
    <>
      <button data-testid={`open-${dialogId}`} onClick={() => dialog.open()}>
        Open
      </button>
      <DialogAnchor id={dialogId} {...dialogAnchorProps}>
        {children ?? <button data-testid={testId}>Dialog content</button>}
      </DialogAnchor>
    </>
  );
};

const DropdownTriggerButton = ({
  children,
  onClick,
  referenceRef,
  ...props
}: DropdownTriggerProps) => (
  <button
    {...props}
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

describe('DialogPortal', () => {
  it('does not close dialogs from another manager when clicking in a different manager overlay', async () => {
    render(
      <DialogManagerProvider id='manager-a'>
        <DialogFixture dialogId='dialog-a' testId='dialog-a-content' />
        <DialogManagerProvider id='manager-b'>
          <DialogFixture dialogId='dialog-b' testId='dialog-b-content' />
        </DialogManagerProvider>
      </DialogManagerProvider>,
    );

    act(() => {
      fireEvent.click(screen.getByTestId('open-dialog-a'));
      fireEvent.click(screen.getByTestId('open-dialog-b'));
    });

    expect(screen.getByTestId('dialog-a-content')).toBeInTheDocument();
    expect(screen.getByTestId('dialog-b-content')).toBeInTheDocument();

    act(() => {
      fireEvent.click(screen.getByTestId('dialog-b-content'));
    });

    await waitFor(() => {
      expect(screen.getByTestId('dialog-a-content')).toBeInTheDocument();
      expect(screen.getByTestId('dialog-b-content')).toBeInTheDocument();
    });
  });

  it('applies modal dialog semantics when focus is trapped', () => {
    render(
      <DialogManagerProvider>
        <DialogFixture
          aria-label='Reaction picker'
          dialogId='dialog-modal'
          testId='dialog-modal-content'
          trapFocus
        />
      </DialogManagerProvider>,
    );

    fireEvent.click(screen.getByTestId('open-dialog-modal'));

    const dialog = screen.getByRole('dialog', { name: 'Reaction picker' });
    expect(dialog).toHaveAttribute('aria-modal', 'true');
  });

  it('prefers aria-labelledby over aria-label and forwards aria-describedby', () => {
    render(
      <DialogManagerProvider>
        <DialogFixture
          aria-describedby='dialog-description'
          aria-label='Fallback name'
          aria-labelledby='dialog-title'
          dialogId='dialog-labelled'
          testId='dialog-labelled-content'
          trapFocus
        >
          <h2 id='dialog-title'>Dialog Title</h2>
          <p id='dialog-description'>Dialog description</p>
          <button data-testid='dialog-labelled-content'>Dialog content</button>
        </DialogFixture>
      </DialogManagerProvider>,
    );

    fireEvent.click(screen.getByTestId('open-dialog-labelled'));

    const dialog = screen.getByRole('dialog', { name: 'Dialog Title' });
    expect(dialog).toHaveAttribute('aria-describedby', 'dialog-description');
    expect(dialog).not.toHaveAttribute('aria-label');
  });

  it('has no accessibility violations for trapped dialog semantics', async () => {
    render(
      <DialogManagerProvider>
        <DialogFixture
          aria-label='Accessible dialog'
          dialogId='dialog-axe'
          testId='dialog-axe-content'
          trapFocus
        />
      </DialogManagerProvider>,
    );

    fireEvent.click(screen.getByTestId('open-dialog-axe'));

    const results = await axe(document.body);
    expect(results).toHaveNoViolations();
  });

  it('does not close the dialog when Escape is handled by a nested dropdown', async () => {
    render(
      <DialogManagerProvider>
        <DialogFixture
          dialogId='dialog-with-dropdown'
          testId='dialog-dropdown-content'
          trapFocus
        >
          <Dropdown
            TriggerComponent={DropdownTriggerButton}
            triggerProps={{ children: 'Duration' }}
          >
            <DropdownItem label='15 minutes' />
            <DropdownItem label='1 hour' />
          </Dropdown>
        </DialogFixture>
      </DialogManagerProvider>,
    );

    fireEvent.click(screen.getByTestId('open-dialog-with-dropdown'));
    expect(screen.getByRole('dialog')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Duration' }));
    await screen.findByRole('menu');

    const item = screen.getByRole('menuitem', { name: '15 minutes' });
    item.focus();

    fireEvent.keyDown(item, { key: 'Escape' });
    fireEvent.keyUp(item, { key: 'Escape' });

    await waitFor(() => {
      expect(screen.queryByRole('menu')).not.toBeInTheDocument();
    });
    expect(screen.getByRole('dialog')).toBeInTheDocument();

    fireEvent.keyUp(document, { key: 'Escape' });

    await waitFor(() => {
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });
  });
});
