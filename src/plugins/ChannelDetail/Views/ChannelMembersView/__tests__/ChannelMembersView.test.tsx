import { act, fireEvent, screen } from '@testing-library/react';
import React from 'react';

import {
  useComponentContext,
  useComponentContextIcons,
  useTranslationContext,
} from '../../../../../context';
import * as DEFAULT_ICONS from '../../../../../components/Icons/icons';
import {
  type ChannelMembersModeViewProps,
  ChannelMembersView,
  type ChannelMembersViewModes,
} from '../ChannelMembersView';
import {
  type ChannelMembersHeaderActionItem,
  DefaultChannelMembersHeaderActions,
} from '../ChannelMembersHeaderActions.defaults';
import { useChannelMemberCount } from '../useChannelMemberCount';
import { createChannel, renderWithChannel } from './testUtils';
import { mockT } from '../../../../../mock-builders/translator';

vi.mock('../useChannelMemberCount');

vi.mock('../../../../../context');

vi.mock('../../ChannelMemberDetailView', () => ({
  ChannelMemberDetail: ({
    member,
    onBack,
  }: {
    member?: { user?: { name?: string }; user_id?: string };
    onBack?: () => void;
  }) => (
    <div data-testid='channel-member-detail-view'>
      <span>{member?.user?.name ?? member?.user_id}</span>
      <button onClick={onBack} type='button'>
        Mock detail back
      </button>
    </div>
  ),
}));

vi.mock('../ChannelMembersAddView', () => ({
  ChannelMembersAddView: ({ modeController }: ChannelMembersModeViewProps) => (
    <div data-testid='channel-members-add-view'>
      <button onClick={() => modeController.setMode('browse')} type='button'>
        Mock add members
      </button>
    </div>
  ),
}));

vi.mock('../ChannelMembersBrowseView', () => ({
  ChannelMembersBrowseView: ({
    onMemberSelect,
  }: {
    onMemberSelect?: (member: {
      user: { id: string; name: string };
      user_id: string;
    }) => void;
  }) => (
    <div data-testid='channel-members-browse-view'>
      Mock browse members
      <button
        onClick={() =>
          onMemberSelect?.({
            user: { id: 'user-1', name: 'Alice' },
            user_id: 'user-1',
          })
        }
        type='button'
      >
        Mock select member
      </button>
    </div>
  ),
}));

vi.mock('../../../../../components/Dialog', () => ({
  ContextMenu: ({ children }: { children: React.ReactNode }) => (
    <div data-testid='channel-members-header-actions-menu'>{children}</div>
  ),
  ContextMenuButton: ({
    children,
    Icon,
    onClick,
    ...props
  }: {
    children: React.ReactNode;
    Icon?: React.ComponentType;
    onClick?: () => void;
  } & React.ComponentProps<'button'>) => (
    <button onClick={onClick} type='button' {...props}>
      {Icon && <Icon />}
      {children}
    </button>
  ),
  Prompt: {
    Header: ({
      description,
      goBack,
      title,
      TrailingContent,
    }: {
      description?: string;
      goBack?: () => void;
      title: string;
      TrailingContent?: React.ComponentType;
    }) => (
      <header>
        <h2>{title}</h2>
        {description && <p>{description}</p>}
        {goBack && (
          <button aria-label='Go back' onClick={goBack} type='button'>
            Go back
          </button>
        )}
        {TrailingContent && <TrailingContent />}
      </header>
    ),
  },
  useContextMenuContext: () => ({ closeMenu: vi.fn() }),
  useDialogIsOpen: () => false,
  useDialogOnNearestManager: ({ id }: { id: string }) => ({
    dialog: {
      close: vi.fn(),
      id,
      toggle: vi.fn(),
    },
    dialogManager: { id: 'nearest-dialog-manager' },
  }),
}));

// Test double for an app-injected custom mode; its button exercises the `modeController` handed to
// every custom mode.
const MockCustomModeView = ({ modeController }: ChannelMembersModeViewProps) => (
  <div data-testid='channel-members-remove-view'>
    <button onClick={() => modeController.setMode('browse')} type='button'>
      Mock done removing
    </button>
  </div>
);

const MockCustomModeTitle = () => <>Manage members</>;

const customModeViews: ChannelMembersViewModes = {
  remove: {
    Body: MockCustomModeView,
    Title: MockCustomModeTitle,
  },
};

const dropdownToggleItem: ChannelMembersHeaderActionItem = {
  Component: DefaultChannelMembersHeaderActions.QuickDropdownToggle,
  placement: 'quick-dropdown-toggle',
};

describe('ChannelMembersView', () => {
  const customHeaderActionSet: ChannelMembersHeaderActionItem[] = [
    {
      Component: () => null,
      placement: 'dropdown',
      type: 'removeMembers',
    },
    {
      Component: () => null,
      placement: 'quick',
      type: 'addMembers',
    },
  ];
  const CustomHeaderActions = ({
    headerActionSet,
    modeController,
  }: {
    modeController: {
      mode: string;
      setMode: (mode: string) => void;
    };
    headerActionSet: ChannelMembersHeaderActionItem[];
  }) => {
    if (modeController.mode !== 'browse') return null;

    const hasAction = (type: string) =>
      headerActionSet.some((action) => 'type' in action && action.type === type);
    const hasManageAction = hasAction('removeMembers');
    const hasAddAction = hasAction('addMembers');

    return (
      <div>
        {hasManageAction && (
          <button
            aria-label='Remove channel members'
            onClick={() => modeController.setMode('remove')}
            type='button'
          >
            Remove
          </button>
        )}
        {hasAddAction && (
          <button
            aria-label='Add channel members'
            onClick={() => modeController.setMode('add')}
            type='button'
          >
            Add
          </button>
        )}
      </div>
    );
  };

  beforeEach(() => {
    // The context module is auto-mocked, so the icon hook would return undefined; hand back the
    // real icons for any component in this tree that reads them.
    vi.mocked(useComponentContextIcons).mockReturnValue(DEFAULT_ICONS);
    vi.clearAllMocks();

    vi.mocked(useTranslationContext).mockReturnValue({
      t: mockT,
    } as ReturnType<typeof useTranslationContext>);
    vi.mocked(useComponentContext).mockReturnValue(
      {} as ReturnType<typeof useComponentContext>,
    );
    vi.mocked(useChannelMemberCount).mockReturnValue(2);
  });

  it('shows only Add button by default when update-channel-members capability is granted', () => {
    renderWithChannel(<ChannelMembersView />);

    expect(
      screen.getByRole('button', { name: 'Add channel members' }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: 'Remove channel members' }),
    ).not.toBeInTheDocument();
    expect(screen.getByTestId('channel-members-browse-view')).toBeInTheDocument();
  });

  it('hides Add button without update-channel-members capability', () => {
    renderWithChannel(<ChannelMembersView />, createChannel({ ownCapabilities: [] }));

    expect(
      screen.queryByRole('button', { name: 'Add channel members' }),
    ).not.toBeInTheDocument();
    expect(screen.getByTestId('channel-members-browse-view')).toBeInTheDocument();
  });

  it('switches to add-member search mode from the header action', () => {
    renderWithChannel(<ChannelMembersView />);

    fireEvent.click(screen.getByRole('button', { name: 'Add channel members' }));

    expect(screen.getByTestId('channel-members-add-view')).toBeInTheDocument();
    expect(screen.queryByTestId('channel-members-browse-view')).not.toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Add members' })).toBeInTheDocument();
  });

  it('does not render header trailing actions outside browse mode', () => {
    const AlwaysRenderingHeaderActions = ({
      modeController,
    }: {
      modeController: {
        setMode: (mode: 'add') => void;
      };
    }) => (
      <button
        aria-label='Always visible header action'
        onClick={() => modeController.setMode('add')}
        type='button'
      >
        Always visible
      </button>
    );

    renderWithChannel(
      <ChannelMembersView HeaderActions={AlwaysRenderingHeaderActions} />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Always visible header action' }));

    expect(screen.getByRole('heading', { name: 'Add members' })).toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: 'Always visible header action' }),
    ).not.toBeInTheDocument();
  });

  it('returns to member list after members are added', () => {
    renderWithChannel(
      <ChannelMembersView />,
      createChannel({ ownCapabilities: ['update-channel-members'] }),
    );

    fireEvent.click(screen.getByRole('button', { name: 'Add channel members' }));
    fireEvent.click(screen.getByRole('button', { name: 'Mock add members' }));

    expect(screen.getByTestId('channel-members-browse-view')).toBeInTheDocument();
  });

  it('renders member detail from ChannelMembersView after browse member selection', () => {
    renderWithChannel(<ChannelMembersView />);

    fireEvent.click(screen.getByRole('button', { name: 'Mock select member' }));

    expect(screen.getByTestId('channel-member-detail-view')).toHaveTextContent('Alice');
    expect(screen.queryByTestId('channel-members-browse-view')).not.toBeInTheDocument();
  });

  it('returns to browse mode from member detail', () => {
    renderWithChannel(<ChannelMembersView />);

    fireEvent.click(screen.getByRole('button', { name: 'Mock select member' }));
    fireEvent.click(screen.getByRole('button', { name: 'Mock detail back' }));

    expect(screen.getByTestId('channel-members-browse-view')).toBeInTheDocument();
  });

  it('renders an injected custom mode view with its title and back button', () => {
    renderWithChannel(
      <ChannelMembersView
        HeaderActions={CustomHeaderActions}
        headerActionSet={customHeaderActionSet}
        modeViews={customModeViews}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Remove channel members' }));

    expect(screen.getByTestId('channel-members-remove-view')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Manage members' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Go back' })).toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: 'Add channel members' }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: 'Remove channel members' }),
    ).not.toBeInTheDocument();
  });

  it('returns to browse mode from a custom mode via go back', () => {
    renderWithChannel(
      <ChannelMembersView
        HeaderActions={CustomHeaderActions}
        headerActionSet={customHeaderActionSet}
        modeViews={customModeViews}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Remove channel members' }));
    fireEvent.click(screen.getByRole('button', { name: 'Go back' }));

    expect(screen.getByTestId('channel-members-browse-view')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: '2 members' })).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Remove channel members' }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Add channel members' }),
    ).toBeInTheDocument();
  });

  it('lets a custom mode navigate back to browse via the modeController', () => {
    renderWithChannel(
      <ChannelMembersView
        HeaderActions={CustomHeaderActions}
        headerActionSet={customHeaderActionSet}
        modeViews={customModeViews}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Remove channel members' }));
    fireEvent.click(screen.getByRole('button', { name: 'Mock done removing' }));

    expect(screen.getByTestId('channel-members-browse-view')).toBeInTheDocument();
  });

  it('falls back to browse when an active mode has no descriptor', () => {
    renderWithChannel(
      <ChannelMembersView
        HeaderActions={CustomHeaderActions}
        headerActionSet={customHeaderActionSet}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Remove channel members' }));

    expect(screen.getByTestId('channel-members-browse-view')).toBeInTheDocument();
    expect(screen.queryByTestId('channel-members-remove-view')).not.toBeInTheDocument();
  });

  it('renders a single dropdown header action behind the dropdown toggle', () => {
    const menuOnlyActionSet: ChannelMembersHeaderActionItem[] = [
      dropdownToggleItem,
      {
        Component: () => <span>Menu only action</span>,
        placement: 'dropdown',
        type: 'addMembers',
      },
    ];

    renderWithChannel(<ChannelMembersView headerActionSet={menuOnlyActionSet} />);

    expect(
      screen.getByRole('button', { name: 'Open members actions' }),
    ).toBeInTheDocument();
    expect(screen.getByText('Menu only action')).toBeInTheDocument();
  });

  it('renders quick actions inline and dropdown actions in the menu', () => {
    const mixedActionSet: ChannelMembersHeaderActionItem[] = [
      dropdownToggleItem,
      {
        Component: () => <span>Quick add action</span>,
        placement: 'quick',
        type: 'addMembers',
      },
      {
        Component: () => <span>Menu manage action</span>,
        placement: 'dropdown',
        type: 'removeMembers',
      },
    ];

    renderWithChannel(<ChannelMembersView headerActionSet={mixedActionSet} />);

    expect(
      screen.getByRole('button', { name: 'Open members actions' }),
    ).toBeInTheDocument();
    const menu = screen.getByTestId('channel-members-header-actions-menu');
    expect(screen.getByText('Quick add action')).toBeInTheDocument();
    expect(menu).not.toHaveTextContent('Quick add action');
    expect(menu).toHaveTextContent('Menu manage action');
  });

  it('renders a custom dropdown toggle item with the default header actions', () => {
    const CustomDropdownToggle = React.forwardRef<HTMLButtonElement>(
      function CustomDropdownToggle(_, ref) {
        return (
          <button aria-label='Custom menu trigger' ref={ref} type='button'>
            Custom actions
          </button>
        );
      },
    );
    const actionSet: ChannelMembersHeaderActionItem[] = [
      { Component: CustomDropdownToggle, placement: 'quick-dropdown-toggle' },
      {
        Component: () => <span>Menu only action</span>,
        placement: 'dropdown',
        type: 'addMembers',
      },
    ];

    renderWithChannel(<ChannelMembersView headerActionSet={actionSet} />);

    expect(
      screen.getByRole('button', { name: 'Custom menu trigger' }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: 'Open members actions' }),
    ).not.toBeInTheDocument();
  });

  it('keeps the header actions mounted when a re-render hands the view a new headerActionSet', () => {
    let mountCount = 0;
    const receivedSets: ChannelMembersHeaderActionItem[][] = [];
    const RecordingHeaderActions = ({
      headerActionSet,
    }: {
      headerActionSet: ChannelMembersHeaderActionItem[];
    }) => {
      receivedSets.push(headerActionSet);
      React.useEffect(() => {
        mountCount += 1;
      }, []);
      return null;
    };
    let renderAgain = () => undefined as void;
    // Builds the set inline, so every render hands the view a new array.
    const View = () => {
      const [, setRenderCount] = React.useState(0);
      renderAgain = () => setRenderCount((count) => count + 1);
      return (
        <ChannelMembersView
          HeaderActions={RecordingHeaderActions}
          headerActionSet={[...customHeaderActionSet]}
        />
      );
    };

    renderWithChannel(<View />);
    const [firstSet] = receivedSets;
    act(() => renderAgain());

    expect(receivedSets.at(-1)).not.toBe(firstSet);
    expect(receivedSets.at(-1)).toEqual(customHeaderActionSet);
    expect(mountCount).toBe(1);
  });
});
