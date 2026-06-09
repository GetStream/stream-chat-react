import { fireEvent, screen } from '@testing-library/react';
import React from 'react';

import {
  useComponentContext,
  useModalContext,
  useTranslationContext,
} from '../../../../../context';
import { ChannelMembersView } from '../ChannelMembersView';
import type { ChannelMembersHeaderActionItem } from '../ChannelMembersHeaderActions.defaults';
import { createChannel, renderWithChannel } from './testUtils';

vi.mock('../../../../../context');

vi.mock('../ChannelMembersViewSearch', () => ({
  ChannelMembersViewSearch: ({
    onMembersAdded,
  }: {
    onMembersAdded: (count: number) => void;
  }) => (
    <div data-testid='channel-members-view-search'>
      <button onClick={() => onMembersAdded(1)} type='button'>
        Mock add members
      </button>
    </div>
  ),
}));

vi.mock('../ChannelMembersViewList', () => ({
  ChannelMembersViewList: ({
    manageMembers,
    onMembersRemoved,
  }: {
    manageMembers?: boolean;
    onMembersRemoved?: (count: number) => void;
  }) => (
    <div data-manage-members={manageMembers} data-testid='channel-members-view-list'>
      {manageMembers && (
        <button onClick={() => onMembersRemoved?.(1)} type='button'>
          Mock remove members
        </button>
      )}
    </div>
  ),
}));

vi.mock('../../../../Dialog', () => ({
  ContextMenu: ({ children }: { children: React.ReactNode }) => (
    <div data-testid='channel-members-header-actions-menu'>{children}</div>
  ),
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
}));

describe('ChannelMembersView', () => {
  const close = vi.fn();
  const customHeaderActionSet: ChannelMembersHeaderActionItem[] = [
    {
      menu: () => null,
      type: 'manageMembers',
    },
    {
      quick: () => null,
      type: 'addMembers',
    },
  ];
  const CustomHeaderActions = ({
    controller,
    headerActionSet,
  }: {
    controller: {
      mode: 'add' | 'browse' | 'manage' | 'memberDetail';
      setMode: (mode: 'add' | 'browse' | 'manage' | 'memberDetail') => void;
    };
    headerActionSet: ChannelMembersHeaderActionItem[];
  }) => {
    if (controller.mode !== 'browse') return null;

    const hasManageAction = headerActionSet.some(
      (action) => action.type === 'manageMembers',
    );
    const hasAddAction = headerActionSet.some((action) => action.type === 'addMembers');

    return (
      <div>
        {hasManageAction && (
          <button
            aria-label='Manage channel members'
            onClick={() => controller.setMode('manage')}
            type='button'
          >
            Manage
          </button>
        )}
        {hasAddAction && (
          <button
            aria-label='Add channel members'
            onClick={() => controller.setMode('add')}
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
  });

  it('shows only Add button by default when update-channel-members capability is granted', () => {
    renderWithChannel(<ChannelMembersView />);

    expect(
      screen.getByRole('button', { name: 'Add channel members' }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: 'Manage channel members' }),
    ).not.toBeInTheDocument();
    expect(screen.getByTestId('channel-members-view-list')).toBeInTheDocument();
  });

  it('hides Add button without update-channel-members capability', () => {
    renderWithChannel(<ChannelMembersView />, createChannel({ ownCapabilities: [] }));

    expect(
      screen.queryByRole('button', { name: 'Add channel members' }),
    ).not.toBeInTheDocument();
    expect(screen.getByTestId('channel-members-view-list')).toBeInTheDocument();
  });

  it('switches to add-member search mode from the header action', () => {
    renderWithChannel(<ChannelMembersView />);

    fireEvent.click(screen.getByRole('button', { name: 'Add channel members' }));

    expect(screen.getByTestId('channel-members-view-search')).toBeInTheDocument();
    expect(screen.queryByTestId('channel-members-view-list')).not.toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Add members' })).toBeInTheDocument();
  });

  it('returns to member list after members are added', () => {
    renderWithChannel(
      <ChannelMembersView />,
      createChannel({ ownCapabilities: ['update-channel-members'] }),
    );

    fireEvent.click(screen.getByRole('button', { name: 'Add channel members' }));
    fireEvent.click(screen.getByRole('button', { name: 'Mock add members' }));

    expect(screen.getByTestId('channel-members-view-list')).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { name: '{{ count }} members:3' }),
    ).toBeInTheDocument();
  });

  it('switches to manage-members mode via custom HeaderActions', () => {
    renderWithChannel(
      <ChannelMembersView
        HeaderActions={CustomHeaderActions}
        headerActionSet={customHeaderActionSet}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Manage channel members' }));

    expect(screen.getByTestId('channel-members-view-list')).toHaveAttribute(
      'data-manage-members',
      'true',
    );
    expect(screen.getByRole('heading', { name: 'Manage members' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Go back' })).toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: 'Add channel members' }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: 'Manage channel members' }),
    ).not.toBeInTheDocument();
  });

  it('returns to browse mode from manage mode via go back', () => {
    renderWithChannel(
      <ChannelMembersView
        HeaderActions={CustomHeaderActions}
        headerActionSet={customHeaderActionSet}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Manage channel members' }));
    fireEvent.click(screen.getByRole('button', { name: 'Go back' }));

    expect(screen.getByTestId('channel-members-view-list')).toHaveAttribute(
      'data-manage-members',
      'false',
    );
    expect(
      screen.getByRole('heading', { name: '{{ count }} members:2' }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Manage channel members' }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Add channel members' }),
    ).toBeInTheDocument();
  });

  it('stays in manage mode after members are removed', () => {
    renderWithChannel(
      <ChannelMembersView
        HeaderActions={CustomHeaderActions}
        headerActionSet={customHeaderActionSet}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Manage channel members' }));
    fireEvent.click(screen.getByRole('button', { name: 'Mock remove members' }));

    expect(screen.getByTestId('channel-members-view-list')).toHaveAttribute(
      'data-manage-members',
      'true',
    );
    expect(screen.getByRole('heading', { name: 'Manage members' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Go back' })).toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: 'Add channel members' }),
    ).not.toBeInTheDocument();
  });

  it('renders menu fallback for a single menu-only header action', () => {
    const menuOnlyActionSet: ChannelMembersHeaderActionItem[] = [
      {
        menu: () => <span>Menu only action</span>,
        type: 'addMembers',
      },
    ];

    renderWithChannel(<ChannelMembersView headerActionSet={menuOnlyActionSet} />);

    expect(
      screen.getByRole('button', { name: 'Open members actions' }),
    ).toBeInTheDocument();
    expect(screen.getByText('Menu only action')).toBeInTheDocument();
  });

  it('prefers menu rendering when multiple actions provide menu variants', () => {
    const mixedActionSet: ChannelMembersHeaderActionItem[] = [
      {
        menu: () => <span>Menu add action</span>,
        quick: () => <span>Quick add action</span>,
        type: 'addMembers',
      },
      {
        menu: () => <span>Menu manage action</span>,
        type: 'manageMembers',
      },
    ];

    renderWithChannel(<ChannelMembersView headerActionSet={mixedActionSet} />);

    expect(
      screen.getByRole('button', { name: 'Open members actions' }),
    ).toBeInTheDocument();
    expect(screen.getByText('Menu add action')).toBeInTheDocument();
    expect(screen.getByText('Menu manage action')).toBeInTheDocument();
    expect(screen.queryByText('Quick add action')).not.toBeInTheDocument();
  });

  it('uses custom menu trigger component for default header actions', () => {
    const menuOnlyActionSet: ChannelMembersHeaderActionItem[] = [
      {
        menu: () => <span>Menu only action</span>,
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
