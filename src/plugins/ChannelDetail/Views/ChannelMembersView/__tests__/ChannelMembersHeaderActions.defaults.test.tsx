import { fireEvent, render, screen } from '@testing-library/react';
import { fromPartial } from '@total-typescript/shoehorn';
import React from 'react';
import type { Channel } from 'stream-chat';

import {
  useComponentContext,
  useComponentContextIcons,
  useTranslationContext,
} from '../../../../../context';
import * as DEFAULT_ICONS from '../../../../../components/Icons/icons';
import { ChannelDetailProvider } from '../../../ChannelDetailContext';
import {
  type ChannelMembersHeaderActionItem,
  DefaultChannelMembersHeaderActions,
  defaultChannelMembersHeaderActionSet,
  DefaultHeaderActions,
} from '../ChannelMembersHeaderActions.defaults';
import type {
  ChannelMembersModeController,
  ChannelMembersViewMode,
} from '../ChannelMembersView';
import { mockT } from '../../../../../mock-builders/translator';

vi.mock('../../../../../context');

const {
  closeMenu,
  contextMenuProps,
  dialogClose,
  dialogToggle,
  useDialogIsOpen,
  useDialogOnNearestManager,
} = vi.hoisted(() => {
  const dialogClose = vi.fn();
  const dialogToggle = vi.fn();
  return {
    closeMenu: vi.fn(),
    // The props of the last rendered ContextMenu, to check its anchor and dialog id.
    contextMenuProps: {} as { id?: string; referenceElement?: HTMLElement | null },
    dialogClose,
    dialogToggle,
    useDialogIsOpen: vi.fn(() => false),
    useDialogOnNearestManager: vi.fn(({ id }: { id: string }) => ({
      dialog: { close: dialogClose, id, toggle: dialogToggle },
      dialogManager: { id: 'nearest-dialog-manager' },
    })),
  };
});

vi.mock('../../../../../components/Dialog', () => ({
  ContextMenu: ({
    children,
    id,
    onClose,
    referenceElement,
  }: {
    children: React.ReactNode;
    id: string;
    onClose: () => void;
    referenceElement: HTMLElement | null;
  }) => {
    Object.assign(contextMenuProps, { id, referenceElement });
    return (
      <div data-testid='header-actions-context-menu'>
        <button onClick={onClose} type='button'>
          Mock close menu
        </button>
        {children}
      </div>
    );
  },
  ContextMenuButton: ({
    children,
    onClick,
  }: {
    children: React.ReactNode;
    onClick?: () => void;
  }) => (
    <button onClick={onClick} type='button'>
      {children}
    </button>
  ),
  useContextMenuContext: () => ({ closeMenu }),
  useDialogIsOpen,
  useDialogOnNearestManager,
}));

const createChannel = (ownCapabilities: string[] = ['update-channel-members']) =>
  fromPartial<Channel>({
    data: {
      own_capabilities: ownCapabilities,
    },
    id: 'channel-1',
  });

const renderWithChannel = (ui: React.ReactElement, channel: Channel = createChannel()) =>
  render(<ChannelDetailProvider channel={channel}>{ui}</ChannelDetailProvider>);

const createModeController = (
  mode: ChannelMembersViewMode = 'browse',
): ChannelMembersModeController => ({
  mode,
  setMode: vi.fn(),
});

describe('ChannelMembersHeaderActions.defaults', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useDialogIsOpen.mockReturnValue(false);
    delete contextMenuProps.id;
    delete contextMenuProps.referenceElement;
    vi.mocked(useTranslationContext).mockReturnValue({
      t: mockT,
    } as ReturnType<typeof useTranslationContext>);
    vi.mocked(useComponentContext).mockReturnValue(
      {} as ReturnType<typeof useComponentContext>,
    );
    vi.mocked(useComponentContextIcons).mockReturnValue(DEFAULT_ICONS);
  });

  const dropdownToggleItem: ChannelMembersHeaderActionItem = {
    Component: DefaultChannelMembersHeaderActions.QuickDropdownToggle,
    placement: 'quick-dropdown-toggle',
  };

  it('renders a quick action inline without the dropdown toggle', () => {
    const actionSet: ChannelMembersHeaderActionItem[] = [
      dropdownToggleItem,
      {
        Component: () => <span>Quick Add</span>,
        placement: 'quick',
        type: 'addMembers',
      },
    ];

    renderWithChannel(
      <DefaultHeaderActions
        headerActionSet={actionSet}
        modeController={createModeController()}
      />,
    );

    expect(screen.getByText('Quick Add')).toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: 'Open members actions' }),
    ).not.toBeInTheDocument();
  });

  it('renders a dropdown action behind the dropdown toggle', () => {
    const actionSet: ChannelMembersHeaderActionItem[] = [
      dropdownToggleItem,
      {
        Component: () => <span>Dropdown Add</span>,
        placement: 'dropdown',
        type: 'addMembers',
      },
    ];

    renderWithChannel(
      <DefaultHeaderActions
        headerActionSet={actionSet}
        modeController={createModeController()}
      />,
    );

    expect(
      screen.getByRole('button', { name: 'Open members actions' }),
    ).toBeInTheDocument();
    expect(screen.getByTestId('header-actions-context-menu')).toHaveTextContent(
      'Dropdown Add',
    );
  });

  it('renders quick actions inline and dropdown actions in the menu', () => {
    const actionSet: ChannelMembersHeaderActionItem[] = [
      dropdownToggleItem,
      {
        Component: () => <span>Quick Add</span>,
        placement: 'quick',
        type: 'addMembers',
      },
      {
        Component: () => <span>Dropdown Manage</span>,
        placement: 'dropdown',
        type: 'removeMembers',
      },
    ];

    renderWithChannel(
      <DefaultHeaderActions
        headerActionSet={actionSet}
        modeController={createModeController()}
      />,
    );

    expect(screen.getByText('Quick Add')).toBeInTheDocument();
    expect(screen.getByTestId('header-actions-context-menu')).not.toHaveTextContent(
      'Quick Add',
    );
    expect(
      screen.getByRole('button', { name: 'Open members actions' }),
    ).toBeInTheDocument();
    expect(screen.getByTestId('header-actions-context-menu')).toHaveTextContent(
      'Dropdown Manage',
    );
  });

  it('renders no menu for dropdown actions when the set has no dropdown toggle', () => {
    const actionSet: ChannelMembersHeaderActionItem[] = [
      {
        Component: () => <span>Dropdown Add</span>,
        placement: 'dropdown',
        type: 'addMembers',
      },
    ];

    renderWithChannel(
      <DefaultHeaderActions
        headerActionSet={actionSet}
        modeController={createModeController()}
      />,
    );

    expect(screen.queryByTestId('header-actions-context-menu')).not.toBeInTheDocument();
    expect(screen.queryByText('Dropdown Add')).not.toBeInTheDocument();
  });

  it('renders nothing when the set holds only the dropdown toggle', () => {
    const { container } = renderWithChannel(
      <DefaultHeaderActions
        headerActionSet={[dropdownToggleItem]}
        modeController={createModeController()}
      />,
    );

    expect(container).toBeEmptyDOMElement();
  });

  it('renders the dropdown toggle item from the set', () => {
    const CustomToggle = React.forwardRef<HTMLButtonElement>(
      function CustomToggle(_, ref) {
        return (
          <button aria-label='Custom members actions toggle' ref={ref} type='button'>
            Custom toggle
          </button>
        );
      },
    );
    const actionSet: ChannelMembersHeaderActionItem[] = [
      { Component: CustomToggle, placement: 'quick-dropdown-toggle' },
      {
        Component: () => <span>Dropdown Add</span>,
        placement: 'dropdown',
        type: 'addMembers',
      },
    ];

    renderWithChannel(
      <DefaultHeaderActions
        headerActionSet={actionSet}
        modeController={createModeController()}
      />,
    );

    expect(
      screen.getByRole('button', { name: 'Custom members actions toggle' }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: 'Open members actions' }),
    ).not.toBeInTheDocument();
  });

  const createDropdownSet = (
    toggleItem: ChannelMembersHeaderActionItem = dropdownToggleItem,
  ): ChannelMembersHeaderActionItem[] => [
    toggleItem,
    {
      Component: () => <span>Dropdown Add</span>,
      placement: 'dropdown',
      type: 'addMembers',
    },
  ];

  const renderDropdownSet = (toggleItem?: ChannelMembersHeaderActionItem) =>
    renderWithChannel(
      <DefaultHeaderActions
        headerActionSet={createDropdownSet(toggleItem)}
        modeController={createModeController()}
      />,
    );

  it('opens, reads and closes its own menu dialog', () => {
    renderDropdownSet();
    fireEvent.click(screen.getByRole('button', { name: 'Open members actions' }));
    fireEvent.click(screen.getByRole('button', { name: 'Mock close menu' }));

    const [[{ id: dialogId }]] = useDialogOnNearestManager.mock.calls;
    expect(dialogId).toMatch(/^channel-members-header-actions-/);
    expect(useDialogIsOpen).toHaveBeenCalledWith(dialogId, 'nearest-dialog-manager');
    expect(contextMenuProps.id).toBe(dialogId);
    expect(dialogToggle).toHaveBeenCalledTimes(1);
    expect(dialogClose).toHaveBeenCalledTimes(1);
  });

  it('gives each instance its own menu dialog id, kept across re-renders', () => {
    // Two instances under one dialog manager, e.g. side-by-side panels of the same channel.
    const renderTwoInstances = () => (
      <ChannelDetailProvider channel={createChannel()}>
        <DefaultHeaderActions
          headerActionSet={createDropdownSet()}
          modeController={createModeController()}
        />
        <DefaultHeaderActions
          headerActionSet={createDropdownSet()}
          modeController={createModeController()}
        />
      </ChannelDetailProvider>
    );

    const { rerender } = render(renderTwoInstances());
    rerender(renderTwoInstances());

    const dialogIds = useDialogOnNearestManager.mock.calls.map(([{ id }]) => id);
    expect(dialogIds.length).toBeGreaterThanOrEqual(4);
    expect(new Set(dialogIds).size).toBe(2);
  });

  it('anchors the menu to the default dropdown toggle', () => {
    renderDropdownSet();

    expect(contextMenuProps.referenceElement).toBe(
      screen.getByRole('button', { name: 'Open members actions' }),
    );
  });

  it('anchors, labels and toggles the menu through a custom dropdown toggle', () => {
    useDialogIsOpen.mockReturnValue(true);
    const CustomToggle = React.forwardRef<
      HTMLButtonElement,
      React.ComponentPropsWithoutRef<'button'>
    >(function CustomToggle(props, ref) {
      return (
        <button aria-label='Custom toggle' ref={ref} type='button' {...props}>
          Custom toggle
        </button>
      );
    });

    renderDropdownSet({ Component: CustomToggle, placement: 'quick-dropdown-toggle' });
    const toggle = screen.getByRole('button', { name: 'Custom toggle' });
    fireEvent.click(toggle);

    expect(contextMenuProps.referenceElement).toBe(toggle);
    expect(toggle).toHaveAttribute('aria-expanded', 'true');
    expect(dialogToggle).toHaveBeenCalledTimes(1);
  });

  it('reflects the open menu in the default toggle aria-expanded', () => {
    useDialogIsOpen.mockReturnValue(true);

    renderDropdownSet();

    expect(screen.getByRole('button', { name: 'Open members actions' })).toHaveAttribute(
      'aria-expanded',
      'true',
    );
  });

  it('hides the dropdown toggle when every dropdown action is filtered out', () => {
    renderWithChannel(
      <DefaultHeaderActions
        headerActionSet={[
          dropdownToggleItem,
          {
            Component: () => <span>Quick Custom</span>,
            placement: 'quick',
            type: 'customAction',
          },
          {
            Component: () => <span>Dropdown Add</span>,
            placement: 'dropdown',
            type: 'addMembers',
          },
        ]}
        modeController={createModeController()}
      />,
      createChannel([]),
    );

    expect(screen.getByText('Quick Custom')).toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: 'Open members actions' }),
    ).not.toBeInTheDocument();
    expect(screen.queryByTestId('header-actions-context-menu')).not.toBeInTheDocument();
  });

  it('hides the dropdown toggle when the only dropdown action is hidden by its isVisible', () => {
    renderWithChannel(
      <DefaultHeaderActions
        headerActionSet={[
          dropdownToggleItem,
          {
            Component: () => <span>Dropdown Custom</span>,
            isVisible: () => false,
            placement: 'dropdown',
            type: 'customAction',
          },
        ]}
        modeController={createModeController()}
      />,
    );

    expect(screen.queryByText('Dropdown Custom')).not.toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: 'Open members actions' }),
    ).not.toBeInTheDocument();
    expect(screen.queryByTestId('header-actions-context-menu')).not.toBeInTheDocument();
  });

  it('switches to add mode and closes the menu from the default AddMembersMenu item', () => {
    const modeController = createModeController();

    renderWithChannel(
      <DefaultHeaderActions
        headerActionSet={[
          dropdownToggleItem,
          {
            Component: DefaultChannelMembersHeaderActions.AddMembersMenu,
            placement: 'dropdown',
            type: 'addMembers',
          },
        ]}
        modeController={modeController}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Add' }));

    expect(modeController.setMode).toHaveBeenCalledWith('add');
    expect(closeMenu).toHaveBeenCalledTimes(1);
  });

  it('starts the default set with the dropdown toggle', () => {
    expect(defaultChannelMembersHeaderActionSet[0]).toEqual({
      Component: DefaultChannelMembersHeaderActions.QuickDropdownToggle,
      placement: 'quick-dropdown-toggle',
    });
  });

  it('hides the addMembers action when the member-management capability is missing', () => {
    const actionSet: ChannelMembersHeaderActionItem[] = [
      {
        Component: () => <span>Quick Add</span>,
        placement: 'quick',
        type: 'addMembers',
      },
    ];

    renderWithChannel(
      <DefaultHeaderActions
        headerActionSet={actionSet}
        modeController={createModeController()}
      />,
      createChannel([]),
    );

    expect(screen.queryByText('Quick Add')).not.toBeInTheDocument();
  });

  it('shows the addMembers action when the member-management capability is present', () => {
    const actionSet: ChannelMembersHeaderActionItem[] = [
      {
        Component: () => <span>Quick Add</span>,
        placement: 'quick',
        type: 'addMembers',
      },
    ];

    renderWithChannel(
      <DefaultHeaderActions
        headerActionSet={actionSet}
        modeController={createModeController()}
      />,
      createChannel(['update-channel-members']),
    );

    expect(screen.getByText('Quick Add')).toBeInTheDocument();
  });

  it('shows a non-member action regardless of the member-management capability', () => {
    const actionSet: ChannelMembersHeaderActionItem[] = [
      {
        Component: () => <span>Custom Action</span>,
        placement: 'quick',
        type: 'customAction',
      },
    ];

    renderWithChannel(
      <DefaultHeaderActions
        headerActionSet={actionSet}
        modeController={createModeController()}
      />,
      createChannel([]),
    );

    expect(screen.getByText('Custom Action')).toBeInTheDocument();
  });

  it('keeps addMembers hidden without the capability even when its isVisible returns true', () => {
    renderWithChannel(
      <DefaultHeaderActions
        headerActionSet={[
          {
            Component: () => <span>Quick Add</span>,
            isVisible: () => true,
            placement: 'quick',
            type: 'addMembers',
          },
        ]}
        modeController={createModeController()}
      />,
      createChannel([]),
    );

    expect(screen.queryByText('Quick Add')).not.toBeInTheDocument();
  });

  it('hides an app-defined action whose isVisible returns false', () => {
    const actionSet: ChannelMembersHeaderActionItem[] = [
      {
        Component: () => <span>Custom Action</span>,
        isVisible: () => false,
        placement: 'quick',
        type: 'customAction',
      },
    ];

    renderWithChannel(
      <DefaultHeaderActions
        headerActionSet={actionSet}
        modeController={createModeController()}
      />,
    );

    expect(screen.queryByText('Custom Action')).not.toBeInTheDocument();
  });

  it('passes the channel to an app-defined isVisible', () => {
    const isVisible = vi.fn(() => true);
    const channel = createChannel(['update-channel-members']);

    renderWithChannel(
      <DefaultHeaderActions
        headerActionSet={[
          {
            Component: () => <span>Custom Action</span>,
            isVisible,
            placement: 'quick',
            type: 'customAction',
          },
        ]}
        modeController={createModeController()}
      />,
      channel,
    );

    expect(isVisible).toHaveBeenCalledWith({ channel });
  });

  it('ships no bulk member-removal surface', () => {
    expect(
      defaultChannelMembersHeaderActionSet.some(
        (action) => 'type' in action && action.type === 'removeMembers',
      ),
    ).toBe(false);
    expect(DefaultChannelMembersHeaderActions).not.toHaveProperty('RemoveMembers');
    expect(DefaultChannelMembersHeaderActions).not.toHaveProperty('RemoveMembersMenu');
  });
});
