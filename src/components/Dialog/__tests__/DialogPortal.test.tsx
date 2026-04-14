import React from 'react';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { useDialogOnNearestManager } from '../hooks';
import { DialogAnchor } from '../service';
import { DialogManagerProvider } from '../../../context';

const DialogFixture = ({ dialogId, testId }: { dialogId: string; testId: string }) => {
  const { dialog } = useDialogOnNearestManager({ id: dialogId });

  return (
    <>
      <button data-testid={`open-${dialogId}`} onClick={() => dialog.open()}>
        Open
      </button>
      <DialogAnchor id={dialogId}>
        <button data-testid={testId}>Dialog content</button>
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
});
