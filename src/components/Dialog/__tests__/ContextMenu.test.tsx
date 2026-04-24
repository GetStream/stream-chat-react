import React, { useState } from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { DialogManagerProvider } from '../../../context';
import { ContextMenu, ContextMenuButton, useContextMenuContext } from '../components';
import { useDialogOnNearestManager } from '../hooks';

const dialogId = 'context-menu-dialog';

const ContextMenuTestSubmenu = () => {
  const { returnToParentMenu } = useContextMenuContext();

  return (
    <ContextMenuButton onClick={returnToParentMenu}>Back from submenu</ContextMenuButton>
  );
};

const ContextMenuOpenSubmenuButton = () => {
  const { openSubmenu } = useContextMenuContext();

  return (
    <ContextMenuButton
      onClick={(event) => {
        openSubmenu({
          focusReturnTarget: event.currentTarget,
          Submenu: ContextMenuTestSubmenu,
        });
      }}
    >
      Open submenu
    </ContextMenuButton>
  );
};

const ContextMenuFixture = ({
  hiddenItemBeforeSubmenuTrigger,
  hiddenItemIndex,
  includeSubmenuTrigger,
}: {
  hiddenItemBeforeSubmenuTrigger?: boolean;
  hiddenItemIndex?: number;
  includeSubmenuTrigger?: boolean;
}) => {
  const [referenceElement, setReferenceElement] = useState<HTMLButtonElement | null>(
    null,
  );
  const { dialog, dialogManager } = useDialogOnNearestManager({ id: dialogId });

  return (
    <>
      <button
        data-testid='open-context-menu'
        onClick={() => dialog.open()}
        ref={setReferenceElement}
      >
        Open
      </button>
      <ContextMenu
        aria-label='Fixture menu'
        dialogManagerId={dialogManager?.id}
        id={dialogId}
        onClose={dialog.close}
        placement='bottom-start'
        referenceElement={referenceElement}
        tabIndex={-1}
        trapFocus
      >
        {hiddenItemBeforeSubmenuTrigger && (
          <ContextMenuButton style={{ display: 'none' }}>
            Hidden before submenu trigger
          </ContextMenuButton>
        )}
        {includeSubmenuTrigger && <ContextMenuOpenSubmenuButton />}
        <ContextMenuButton
          style={hiddenItemIndex === 0 ? { display: 'none' } : undefined}
        >
          First item
        </ContextMenuButton>
        <ContextMenuButton
          style={hiddenItemIndex === 1 ? { display: 'none' } : undefined}
        >
          Second item
        </ContextMenuButton>
        <ContextMenuButton
          style={hiddenItemIndex === 2 ? { display: 'none' } : undefined}
        >
          Third item
        </ContextMenuButton>
      </ContextMenu>
    </>
  );
};

describe('ContextMenu keyboard navigation', () => {
  const openMenu = async () => {
    fireEvent.click(screen.getByTestId('open-context-menu'));
    await screen.findByRole('menu', { name: 'Fixture menu' });

    return screen.getAllByRole('menuitem') as HTMLButtonElement[];
  };

  it('supports ArrowUp/ArrowDown/Home/End', async () => {
    render(
      <DialogManagerProvider>
        <ContextMenuFixture />
      </DialogManagerProvider>,
    );

    const [firstItem, secondItem, thirdItem] = await openMenu();

    firstItem.focus();
    fireEvent.keyDown(firstItem, { key: 'ArrowDown' });
    expect(secondItem).toHaveFocus();

    fireEvent.keyDown(secondItem, { key: 'ArrowUp' });
    expect(firstItem).toHaveFocus();

    fireEvent.keyDown(firstItem, { key: 'End' });
    expect(thirdItem).toHaveFocus();

    fireEvent.keyDown(thirdItem, { key: 'Home' });
    expect(firstItem).toHaveFocus();
  });

  it('wraps around from last to first and first to last', async () => {
    render(
      <DialogManagerProvider>
        <ContextMenuFixture />
      </DialogManagerProvider>,
    );

    const items = await openMenu();
    const firstItem = items[0];
    const lastItem = items[items.length - 1];

    lastItem.focus();
    fireEvent.keyDown(lastItem, { key: 'ArrowDown' });
    expect(firstItem).toHaveFocus();

    fireEvent.keyDown(firstItem, { key: 'ArrowUp' });
    expect(lastItem).toHaveFocus();
  });

  it('skips hidden menuitems when wrapping focus', async () => {
    render(
      <DialogManagerProvider>
        <ContextMenuFixture hiddenItemIndex={0} />
      </DialogManagerProvider>,
    );

    const [firstVisibleItem, lastVisibleItem] = await openMenu();
    firstVisibleItem.focus();

    fireEvent.keyDown(firstVisibleItem, { key: 'ArrowUp' });
    expect(lastVisibleItem).toHaveFocus();

    fireEvent.keyDown(lastVisibleItem, { key: 'ArrowDown' });
    expect(firstVisibleItem).toHaveFocus();
  });

  it('includes the back button in keyboard navigation within a submenu', async () => {
    render(
      <DialogManagerProvider>
        <ContextMenuFixture includeSubmenuTrigger />
      </DialogManagerProvider>,
    );

    await openMenu();
    const parentItem = screen.getByRole('menuitem', { name: 'Open submenu' });
    parentItem.focus();

    fireEvent.click(parentItem);

    const submenuItems = screen.getAllByRole('menuitem') as HTMLButtonElement[];
    // The back button (rendered by default ContextMenuBackButton) should be
    // included alongside the submenu item.
    const backButton = submenuItems.find((item) =>
      item.classList.contains('str-chat__context-menu__back-button'),
    );
    expect(backButton).toBeDefined();

    const submenuItem = screen.getByRole('menuitem', { name: 'Back from submenu' });
    submenuItem.focus();

    fireEvent.keyDown(submenuItem, { key: 'ArrowUp' });
    expect(backButton).toHaveFocus();
  });

  it('restores focus to parent item when returning from submenu', async () => {
    render(
      <DialogManagerProvider>
        <ContextMenuFixture includeSubmenuTrigger />
      </DialogManagerProvider>,
    );

    await openMenu();
    const parentItem = screen.getByRole('menuitem', { name: 'Open submenu' });
    parentItem.focus();

    fireEvent.click(parentItem);
    fireEvent.click(screen.getByRole('menuitem', { name: 'Back from submenu' }));

    await waitFor(() => {
      expect(screen.getByRole('menuitem', { name: 'Open submenu' })).toHaveFocus();
    });
  });

  it('restores focus to parent item when hidden items precede submenu parent', async () => {
    render(
      <DialogManagerProvider>
        <ContextMenuFixture hiddenItemBeforeSubmenuTrigger includeSubmenuTrigger />
      </DialogManagerProvider>,
    );

    await openMenu();
    const parentItem = screen.getByRole('menuitem', { name: 'Open submenu' });
    parentItem.focus();

    fireEvent.click(parentItem);
    fireEvent.click(screen.getByRole('menuitem', { name: 'Back from submenu' }));

    await waitFor(() => {
      expect(screen.getByRole('menuitem', { name: 'Open submenu' })).toHaveFocus();
    });
  });
});
