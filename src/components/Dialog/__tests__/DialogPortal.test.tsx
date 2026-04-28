import React from 'react';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
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
});
