import { render, screen } from '@testing-library/react';
import { fromPartial } from '@total-typescript/shoehorn';
import React from 'react';
import type { Channel } from 'stream-chat';

import {
  useComponentContext,
  useModalContext,
  useTranslationContext,
} from '../../../../../context';
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

vi.mock('../../../../../context');

vi.mock('../../../../../components/Dialog', () => ({
  ContextMenu: ({ children }: { children: React.ReactNode }) => (
    <div data-testid='header-actions-context-menu'>{children}</div>
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
    vi.mocked(useTranslationContext).mockReturnValue({
      t: (key: string) => key,
    } as ReturnType<typeof useTranslationContext>);
    vi.mocked(useModalContext).mockReturnValue({} as ReturnType<typeof useModalContext>);
    vi.mocked(useComponentContext).mockReturnValue(
      {} as ReturnType<typeof useComponentContext>,
    );
  });

  it('renders a quick action inline without a menu trigger', () => {
    const actionSet: ChannelMembersHeaderActionItem[] = [
      {
        component: () => <span>Quick Add</span>,
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

  it('renders a menu action behind the actions trigger', () => {
    const actionSet: ChannelMembersHeaderActionItem[] = [
      {
        component: () => <span>Menu Add</span>,
        placement: 'menu',
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
    expect(screen.getByText('Menu Add')).toBeInTheDocument();
  });

  it('renders quick actions inline and menu actions in the menu', () => {
    const actionSet: ChannelMembersHeaderActionItem[] = [
      {
        component: () => <span>Quick Add</span>,
        placement: 'quick',
        type: 'addMembers',
      },
      {
        component: () => <span>Menu Manage</span>,
        placement: 'menu',
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
    expect(
      screen.getByRole('button', { name: 'Open members actions' }),
    ).toBeInTheDocument();
    expect(screen.getByText('Menu Manage')).toBeInTheDocument();
  });

  it('uses custom menu trigger component when provided', () => {
    const actionSet: ChannelMembersHeaderActionItem[] = [
      {
        component: () => <span>Menu Add</span>,
        placement: 'menu',
        type: 'addMembers',
      },
    ];
    const CustomTrigger = ({
      onClick,
      referenceRef,
    }: {
      onClick: () => void;
      referenceRef?: React.Ref<HTMLButtonElement>;
    }) => (
      <button
        aria-label='Custom members actions trigger'
        onClick={onClick}
        ref={referenceRef}
        type='button'
      >
        Custom trigger
      </button>
    );

    renderWithChannel(
      <DefaultHeaderActions
        headerActionSet={actionSet}
        HeaderActionsMenuTrigger={CustomTrigger}
        modeController={createModeController()}
      />,
    );

    expect(
      screen.getByRole('button', { name: 'Custom members actions trigger' }),
    ).toBeInTheDocument();
  });

  it('hides the addMembers action when the member-management capability is missing', () => {
    const actionSet: ChannelMembersHeaderActionItem[] = [
      {
        component: () => <span>Quick Add</span>,
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
        component: () => <span>Quick Add</span>,
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
        component: () => <span>Custom Action</span>,
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

  it('hides an app-defined action when its own filter returns false', () => {
    const actionSet: ChannelMembersHeaderActionItem[] = [
      {
        component: () => <span>Custom Action</span>,
        filter: () => false,
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

  it('passes the channel to an app-defined filter', () => {
    const filter = vi.fn(() => true);
    const channel = createChannel(['update-channel-members']);

    renderWithChannel(
      <DefaultHeaderActions
        headerActionSet={[
          {
            component: () => <span>Custom Action</span>,
            filter,
            placement: 'quick',
            type: 'customAction',
          },
        ]}
        modeController={createModeController()}
      />,
      channel,
    );

    expect(filter).toHaveBeenCalledWith({ channel });
  });

  it('ships no bulk member-removal surface', () => {
    expect(
      defaultChannelMembersHeaderActionSet.some(
        (action) => action.type === 'removeMembers',
      ),
    ).toBe(false);
    expect(DefaultChannelMembersHeaderActions).not.toHaveProperty('RemoveMembers');
    expect(DefaultChannelMembersHeaderActions).not.toHaveProperty('RemoveMembersMenu');
  });
});
