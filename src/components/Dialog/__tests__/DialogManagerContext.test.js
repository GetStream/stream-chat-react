import React from 'react';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import {
  DialogManagerProvider,
  useDialogManager,
} from '../../../context/DialogManagerContext';

import '@testing-library/jest-dom';
import { useDialogIsOpen, useOpenedDialogCount } from '../hooks';

const TEST_IDS = {
  CLOSE_DIALOG: 'close-dialog',
  DIALOG_COUNT: 'dialog-count',
  DIALOG_OPEN: 'dialog-open',
  MANAGER_ID_DISPLAY: 'manager-id-display',
  OPEN_DIALOG: 'open-dialog',
  TEST_COMPONENT: 'test-component',
};

const TEST_MANAGER_ID = 'test-manager';
const SHARED_MANAGER_ID = 'shared-manager';
const MANAGER_1_ID = 'manager-1';
const MANAGER_2_ID = 'manager-2';

const TestComponent = ({ dialogId, dialogManagerId, testId }) => {
  const { dialogManager } = useDialogManager({ dialogId, dialogManagerId });
  const openDialogCount = useOpenedDialogCount({ dialogManagerId });
  const isOpen = useDialogIsOpen(dialogId, dialogManagerId);
  return (
    <div data-testid={testId ?? TEST_IDS.TEST_COMPONENT}>
      <span data-testid={TEST_IDS.MANAGER_ID_DISPLAY}>{dialogManager?.id}</span>
      <span data-testid={TEST_IDS.DIALOG_COUNT}>{openDialogCount}</span>
      <span data-testid={TEST_IDS.DIALOG_OPEN}>{isOpen ? 'true' : 'false'}</span>
    </div>
  );
};

const DialogTestComponent = ({ dialogId, managerId }) => {
  const { dialogManager } = useDialogManager({ dialogManagerId: managerId });

  const handleOpenDialog = () => {
    if (dialogManager) {
      dialogManager.open({ id: dialogId });
    }
  };

  const handleCloseDialog = () => {
    if (dialogManager) {
      dialogManager.close(dialogId);
    }
  };

  return (
    <div>
      <button data-testid={TEST_IDS.OPEN_DIALOG} onClick={handleOpenDialog}>
        Open
      </button>
      <button data-testid={TEST_IDS.CLOSE_DIALOG} onClick={handleCloseDialog}>
        Close
      </button>
    </div>
  );
};

describe('DialogManagerContext', () => {
  describe('DialogManagerProvider', () => {
    it('creates a new dialog manager when no id is provided with randomly generated id', () => {
      render(
        <DialogManagerProvider>
          <TestComponent />
        </DialogManagerProvider>,
      );

      expect(screen.getByTestId(TEST_IDS.DIALOG_COUNT).textContent).toBe('0');
      expect(screen.getByTestId(TEST_IDS.MANAGER_ID_DISPLAY).textContent).toEqual(
        expect.any(String),
      );
    });

    it('creates a new dialog manager and adds it to the manager pool when id is provided', () => {
      render(
        <DialogManagerProvider id={TEST_MANAGER_ID}>
          <TestComponent dialogManagerId={TEST_MANAGER_ID} />
        </DialogManagerProvider>,
      );

      expect(screen.getByTestId(TEST_IDS.MANAGER_ID_DISPLAY).textContent).toBe(
        TEST_MANAGER_ID,
      );
      expect(screen.getByTestId(TEST_IDS.DIALOG_COUNT).textContent).toBe('0');
    });

    it('provides dialog manager to non-child components', () => {
      render(
        <DialogManagerProvider id={MANAGER_1_ID}>
          <DialogManagerProvider id={MANAGER_2_ID} />
          <TestComponent dialogManagerId={MANAGER_2_ID} />
        </DialogManagerProvider>,
      );
      expect(screen.getByTestId(TEST_IDS.MANAGER_ID_DISPLAY).textContent).toBe(
        MANAGER_2_ID,
      );
      expect(screen.getByTestId(TEST_IDS.DIALOG_COUNT).textContent).toBe('0');
    });

    it('removes the dialog manager from the pool upon unmount', () => {
      const { rerender } = render(
        <DialogManagerProvider id={TEST_MANAGER_ID}>
          <TestComponent dialogManagerId={TEST_MANAGER_ID} />
        </DialogManagerProvider>,
      );

      const managerId = screen.getByTestId(TEST_IDS.MANAGER_ID_DISPLAY).textContent;
      expect(managerId).toBe(TEST_MANAGER_ID);

      rerender(
        <DialogManagerProvider id='different-manager'>
          <TestComponent dialogManagerId={TEST_MANAGER_ID} />
        </DialogManagerProvider>,
      );

      expect(screen.getByTestId(TEST_IDS.MANAGER_ID_DISPLAY)).toHaveTextContent(
        'different-manager',
      );
      expect(screen.getByTestId(TEST_IDS.DIALOG_COUNT)).toHaveTextContent('0');
    });

    it('retrieves the existing dialog manager and does not create a new dialog manager', () => {
      const dialogId = 'shared-dialog';
      render(
        <DialogManagerProvider id={SHARED_MANAGER_ID}>
          <TestComponent
            dialogId={dialogId}
            dialogManagerId={SHARED_MANAGER_ID}
            testId={'component-1'}
          />
          <DialogManagerProvider id={SHARED_MANAGER_ID}>
            <DialogTestComponent dialogId={dialogId} managerId={SHARED_MANAGER_ID} />
            <TestComponent
              dialogId={dialogId}
              dialogManagerId={SHARED_MANAGER_ID}
              testId={'component-2'}
            />
          </DialogManagerProvider>
        </DialogManagerProvider>,
      );

      const component1 = screen.getByTestId('component-1');
      const component2 = screen.getByTestId('component-2');

      expect(
        component1.querySelector(`[data-testid="${TEST_IDS.MANAGER_ID_DISPLAY}"`),
      ).toHaveTextContent(SHARED_MANAGER_ID);
      expect(
        component2.querySelector(`[data-testid="${TEST_IDS.MANAGER_ID_DISPLAY}"`),
      ).toHaveTextContent(SHARED_MANAGER_ID);

      act(() => {
        fireEvent.click(screen.getByTestId(TEST_IDS.OPEN_DIALOG));
      });
      expect(
        component1.querySelector(`[data-testid="${TEST_IDS.DIALOG_COUNT}"`),
      ).toHaveTextContent('1');
      expect(
        component2.querySelector(`[data-testid="${TEST_IDS.DIALOG_COUNT}"`),
      ).toHaveTextContent('1');
      expect(
        component1.querySelector(`[data-testid="${TEST_IDS.DIALOG_OPEN}"`),
      ).toHaveTextContent('true');
      expect(
        component2.querySelector(`[data-testid="${TEST_IDS.DIALOG_OPEN}"`),
      ).toHaveTextContent('true');
    });

    it('creates different managers for different IDs', () => {
      render(
        <DialogManagerProvider id={MANAGER_1_ID}>
          <DialogManagerProvider id={MANAGER_2_ID}>
            <DialogTestComponent dialogId='dialog-1' managerId={MANAGER_1_ID} />
            <DialogTestComponent dialogId='dialog-2' managerId={MANAGER_2_ID} />
            <TestComponent dialogManagerId={MANAGER_1_ID} />
            <TestComponent dialogManagerId={MANAGER_2_ID} />
          </DialogManagerProvider>
        </DialogManagerProvider>,
      );

      const testComponents = screen.getAllByTestId(TEST_IDS.TEST_COMPONENT);
      expect(testComponents).toHaveLength(2);

      const manager1Id = testComponents[0].querySelector(
        `[data-testid="${TEST_IDS.MANAGER_ID_DISPLAY}"]`,
      ).textContent;
      const manager2Id = testComponents[1].querySelector(
        `[data-testid="${TEST_IDS.MANAGER_ID_DISPLAY}"]`,
      ).textContent;

      expect(manager1Id).toBe(MANAGER_1_ID);
      expect(manager2Id).toBe(MANAGER_2_ID);

      act(() => {
        screen.getAllByTestId(TEST_IDS.OPEN_DIALOG)[0].click();
      });

      const manager1Count = testComponents[0].querySelector(
        `[data-testid="${TEST_IDS.DIALOG_COUNT}"]`,
      ).textContent;
      const manager2Count = testComponents[1].querySelector(
        `[data-testid="${TEST_IDS.DIALOG_COUNT}"]`,
      ).textContent;

      expect(manager1Count).toBe('1');
      expect(manager2Count).toBe('0');

      act(() => {
        screen.getAllByTestId(TEST_IDS.OPEN_DIALOG)[1].click();
      });

      const manager1CountAfter = testComponents[0].querySelector(
        `[data-testid="${TEST_IDS.DIALOG_COUNT}"]`,
      ).textContent;
      const manager2CountAfter = testComponents[1].querySelector(
        `[data-testid="${TEST_IDS.DIALOG_COUNT}"]`,
      ).textContent;

      expect(manager1CountAfter).toBe('1');
      expect(manager2CountAfter).toBe('1');
    });

    it('does not retrieve dialog manager only by dialog id', async () => {
      render(
        <DialogManagerProvider id={MANAGER_1_ID}>
          <DialogTestComponent dialogId='manager-1-dialog' managerId={MANAGER_1_ID} />
          <DialogManagerProvider id={MANAGER_2_ID}>
            <TestComponent dialogId='manager-1-dialog' />
          </DialogManagerProvider>
        </DialogManagerProvider>,
      );

      await act(() => {
        fireEvent.click(screen.getByTestId(TEST_IDS.OPEN_DIALOG));
      });

      await waitFor(async () => {
        expect(await screen.findByTestId(TEST_IDS.DIALOG_COUNT)).toHaveTextContent('0');
        const managerId = screen.getByTestId(TEST_IDS.MANAGER_ID_DISPLAY).textContent;
        expect(managerId).toBe(MANAGER_2_ID);
      });
    });

    it('uses the manager from the nearest context provider when manager is not found by id', () => {
      render(
        <DialogManagerProvider id={MANAGER_1_ID}>
          <TestComponent dialogManagerId='non-existent' />
        </DialogManagerProvider>,
      );

      expect(screen.getByTestId(TEST_IDS.MANAGER_ID_DISPLAY)).toHaveTextContent(
        MANAGER_1_ID,
      );
    });
  });
});
