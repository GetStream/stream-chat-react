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
  DefaultHeaderActions,
} from '../ChannelMembersHeaderActions.defaults';
import type {
  ChannelMembersViewController,
  ChannelMembersViewMode,
} from '../ChannelMembersView';

vi.mock('../../../../../context');

vi.mock('../../../../Dialog', () => ({
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

const createController = (
  mode: ChannelMembersViewMode = 'browse',
): ChannelMembersViewController => ({
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

  it('renders quick variant for single action when available', () => {
    const actionSet: ChannelMembersHeaderActionItem[] = [
      {
        quick: () => <span>Quick Add</span>,
        type: 'addMembers',
      },
    ];

    renderWithChannel(
      <DefaultHeaderActions
        controller={createController()}
        headerActionSet={actionSet}
      />,
    );

    expect(screen.getByText('Quick Add')).toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: 'Open members actions' }),
    ).not.toBeInTheDocument();
  });

  it('renders menu fallback for single action without quick variant', () => {
    const actionSet: ChannelMembersHeaderActionItem[] = [
      {
        menu: () => <span>Menu Add</span>,
        type: 'addMembers',
      },
    ];

    renderWithChannel(
      <DefaultHeaderActions
        controller={createController()}
        headerActionSet={actionSet}
      />,
    );

    expect(
      screen.getByRole('button', { name: 'Open members actions' }),
    ).toBeInTheDocument();
    expect(screen.getByText('Menu Add')).toBeInTheDocument();
  });

  it('prefers menu variants when multiple actions exist', () => {
    const actionSet: ChannelMembersHeaderActionItem[] = [
      {
        menu: () => <span>Menu Add</span>,
        quick: () => <span>Quick Add</span>,
        type: 'addMembers',
      },
      {
        menu: () => <span>Menu Manage</span>,
        type: 'removeMembers',
      },
    ];

    renderWithChannel(
      <DefaultHeaderActions
        controller={createController()}
        headerActionSet={actionSet}
      />,
    );

    expect(screen.getByText('Menu Add')).toBeInTheDocument();
    expect(screen.getByText('Menu Manage')).toBeInTheDocument();
    expect(screen.queryByText('Quick Add')).not.toBeInTheDocument();
  });

  it('uses custom menu trigger component when provided', () => {
    const actionSet: ChannelMembersHeaderActionItem[] = [
      {
        menu: () => <span>Menu Add</span>,
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
        controller={createController()}
        headerActionSet={actionSet}
        HeaderActionsMenuTrigger={CustomTrigger}
      />,
    );

    expect(
      screen.getByRole('button', { name: 'Custom members actions trigger' }),
    ).toBeInTheDocument();
  });

  it('filters actions out when update-channel-members capability is missing', () => {
    const actionSet: ChannelMembersHeaderActionItem[] = [
      {
        quick: () => <span>Quick Add</span>,
        type: 'addMembers',
      },
    ];

    renderWithChannel(
      <DefaultHeaderActions
        controller={createController()}
        headerActionSet={actionSet}
      />,
      createChannel([]),
    );

    expect(screen.queryByText('Quick Add')).not.toBeInTheDocument();
  });
});
