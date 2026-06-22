import { fireEvent, screen } from '@testing-library/react';
import React from 'react';

import {
  useComponentContext,
  useModalContext,
  useTranslationContext,
} from '../../../../../context';
import {
  type ChannelMembersModeViewProps,
  ChannelMembersView,
  type ChannelMembersViewModes,
} from '../ChannelMembersView';
import type { ChannelMembersHeaderActionItem } from '../ChannelMembersHeaderActions.defaults';
import { useChannelMemberCount } from '../useChannelMemberCount';
import { createChannel, renderWithChannel } from './testUtils';

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
  useDialog: ({ id }: { id: string }) => ({
    close: vi.fn(),
    id,
    toggle: vi.fn(),
  }),
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

// Test double for an app-injected custom mode. Its button exercises the
// modeController the SDK hands to every custom mode.
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

describe('ChannelMembersView', () => {
  const close = vi.fn();
  const customHeaderActionSet: ChannelMembersHeaderActionItem[] = [
    {
      component: () => null,
      placement: 'menu',
      type: 'removeMembers',
    },
    {
      component: () => null,
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

    const hasManageAction = headerActionSet.some(
      (action) => action.type === 'removeMembers',
    );
    const hasAddAction = headerActionSet.some((action) => action.type === 'addMembers');

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
    vi.clearAllMocks();

    vi.mocked(useTranslationContext).mockReturnValue({
      t: (key: string, options?: { count?: number }) =>
        options?.count ? `${key}:${options.count}` : key,
    } as ReturnType<typeof useTranslationContext>);

    vi.mocked(useModalContext).mockReturnValue({
      close,
    } as ReturnType<typeof useModalContext>);
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
    expect(
      screen.getByRole('heading', { name: '{{ count }} members:2' }),
    ).toBeInTheDocument();
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

  it('renders a single menu-placed header action behind the trigger', () => {
    const menuOnlyActionSet: ChannelMembersHeaderActionItem[] = [
      {
        component: () => <span>Menu only action</span>,
        placement: 'menu',
        type: 'addMembers',
      },
    ];

    renderWithChannel(<ChannelMembersView headerActionSet={menuOnlyActionSet} />);

    expect(
      screen.getByRole('button', { name: 'Open members actions' }),
    ).toBeInTheDocument();
    expect(screen.getByText('Menu only action')).toBeInTheDocument();
  });

  it('renders quick-placed actions inline and menu-placed actions in the menu', () => {
    const mixedActionSet: ChannelMembersHeaderActionItem[] = [
      {
        component: () => <span>Quick add action</span>,
        placement: 'quick',
        type: 'addMembers',
      },
      {
        component: () => <span>Menu manage action</span>,
        placement: 'menu',
        type: 'removeMembers',
      },
    ];

    renderWithChannel(<ChannelMembersView headerActionSet={mixedActionSet} />);

    expect(
      screen.getByRole('button', { name: 'Open members actions' }),
    ).toBeInTheDocument();
    expect(screen.getByText('Quick add action')).toBeInTheDocument();
    expect(screen.getByText('Menu manage action')).toBeInTheDocument();
  });

  it('uses custom menu trigger component for default header actions', () => {
    const menuOnlyActionSet: ChannelMembersHeaderActionItem[] = [
      {
        component: () => <span>Menu only action</span>,
        placement: 'menu',
        type: 'addMembers',
      },
    ];

    const CustomMenuTrigger = ({
      onClick,
      referenceRef,
    }: {
      onClick: () => void;
      referenceRef?: React.Ref<HTMLButtonElement>;
    }) => (
      <button
        aria-label='Custom menu trigger'
        onClick={onClick}
        ref={referenceRef}
        type='button'
      >
        Custom actions
      </button>
    );

    renderWithChannel(
      <ChannelMembersView
        headerActionSet={menuOnlyActionSet}
        HeaderActionsMenuTrigger={CustomMenuTrigger}
      />,
    );

    expect(
      screen.getByRole('button', { name: 'Custom menu trigger' }),
    ).toBeInTheDocument();
  });
});
