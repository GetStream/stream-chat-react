import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import type { Channel, Mute } from 'stream-chat';

import { ChannelDetailProvider } from '../ChannelDetailContext';
import { ChannelManagementView } from '../Views/ChannelManagementView/ChannelManagementView';

const mocks = vi.hoisted(() => ({
  addNotification: vi.fn(),
  channel: {
    data: {
      member_count: 2,
      name: 'Test channel',
      own_capabilities: ['update-channel'],
    },
    sendImage: vi.fn(),
    state: {
      members: {
        'other-user': { user: { id: 'other-user' } },
        'own-user': { user: { id: 'own-user' } },
      },
      membership: {},
    },
    updatePartial: vi.fn(),
  },
  close: vi.fn(),
  displayImage: undefined as string | undefined,
  mutes: [] as Mute[],
}));

vi.mock('../../../context', () => ({
  useChatContext: () => ({
    client: {
      user: { id: 'own-user' },
    },
    mutes: mocks.mutes,
  }),
  useComponentContext: () => ({
    Avatar: () => <div data-testid='channel-management-avatar' />,
  }),
  useModalContext: () => ({ close: mocks.close }),
  useTranslationContext: () => ({ t: (key: string) => key }),
}));

vi.mock('../../../context/ChatContext', () => ({
  useChatContext: () => ({
    client: {
      user: { id: 'own-user' },
    },
    mutes: mocks.mutes,
  }),
}));

vi.mock('../../../components/ChannelList', () => ({
  useChannelMembershipState: () => mocks.channel.state.membership,
}));

vi.mock('../../../components/ChannelListItem', async (importOriginal) => {
  const actual =
    await importOriginal<typeof import('../../../components/ChannelListItem')>();

  return {
    ...actual,
    useChannelPreviewInfo: () => ({
      displayImage: mocks.displayImage,
      displayTitle: 'Other user',
      groupChannelDisplayInfo: { members: [] },
    }),
  };
});

vi.mock('../../../components/ChannelListItem/hooks/useIsChannelMuted', () => ({
  useIsChannelMuted: () => ({ muted: false }),
}));

vi.mock('../../../components/ChannelHeader/hooks/useChannelHasMembersOnline', () => ({
  useChannelHasMembersOnline: () => false,
}));

vi.mock('../../../components/ChannelHeader/hooks/useChannelHeaderOnlineStatus', () => ({
  useChannelHeaderOnlineStatus: () => undefined,
}));

vi.mock('../../../components/Dialog', () => ({
  Prompt: {
    Body: ({
      children,
      className,
    }: {
      children: React.ReactNode;
      className?: string;
    }) => <div className={className}>{children}</div>,
    Footer: ({
      children,
      className,
    }: {
      children: React.ReactNode;
      className?: string;
    }) => <footer className={className}>{children}</footer>,
    FooterControls: ({
      children,
      className,
    }: {
      children: React.ReactNode;
      className?: string;
    }) => <div className={className}>{children}</div>,
    FooterControlsButtonPrimary: (
      props: React.ButtonHTMLAttributes<HTMLButtonElement>,
    ) => <button {...props} />,
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
          <button aria-label='Go back' onClick={goBack}>
            Go back
          </button>
        )}
        {TrailingContent && <TrailingContent />}
      </header>
    ),
  },
}));

vi.mock('../../../components/Icons', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../../components/Icons')>();

  return {
    ...actual,
    IconMute: () => <span data-testid='channel-management-muted-icon' />,
    IconPin: () => <span data-testid='channel-management-pinned-icon' />,
  };
});

vi.mock('../../../components/Notifications/hooks/useNotificationApi', () => ({
  useNotificationApi: () => ({ addNotification: mocks.addNotification }),
}));

const renderChannelManagementView = (
  props: Partial<React.ComponentProps<typeof ChannelManagementView>> = {},
) =>
  render(
    <ChannelDetailProvider channel={mocks.channel as unknown as Channel}>
      <ChannelManagementView channelManagementActionSet={[]} layout='tabs' {...props} />
    </ChannelDetailProvider>,
  );

describe('ChannelManagementView', () => {
  beforeEach(() => {
    Object.defineProperty(URL, 'createObjectURL', {
      configurable: true,
      value: vi.fn(() => 'blob:preview'),
    });
    Object.defineProperty(URL, 'revokeObjectURL', {
      configurable: true,
      value: vi.fn(),
    });
    mocks.addNotification.mockReset();
    mocks.channel.sendImage.mockReset();
    mocks.channel.updatePartial.mockReset();
    mocks.channel.sendImage.mockResolvedValue({ file: 'https://stream-upload.example' });
    mocks.channel.updatePartial.mockResolvedValue({});
    mocks.channel.data.name = 'Test channel';
    mocks.channel.data.member_count = 2;
    mocks.channel.data.own_capabilities = ['update-channel'];
    mocks.displayImage = undefined;
    mocks.mutes = [];
  });

  it('reacts to muted DM user state from ChatContext mutes', () => {
    const { rerender } = renderChannelManagementView();

    expect(screen.queryByTestId('channel-management-muted-icon')).not.toBeInTheDocument();

    mocks.mutes = [
      {
        target: { id: 'other-user' },
      } as Mute,
    ];

    rerender(
      <ChannelDetailProvider channel={mocks.channel as unknown as Channel}>
        <ChannelManagementView channelManagementActionSet={[]} layout='tabs' />
      </ChannelDetailProvider>,
    );

    expect(screen.getByTestId('channel-management-muted-icon')).toBeInTheDocument();
  });

  it('renders custom view and edit mode components', () => {
    const ViewModeComponent = vi.fn(() => <div data-testid='custom-view-mode' />);
    const EditModeComponent = vi.fn(() => <div data-testid='custom-edit-mode' />);

    renderChannelManagementView({ EditModeComponent, ViewModeComponent });

    expect(screen.getByTestId('custom-view-mode')).toBeInTheDocument();
    expect(ViewModeComponent).toHaveBeenCalledWith({ actions: [] }, undefined);

    fireEvent.click(screen.getByRole('button', { name: 'Edit chat data' }));

    expect(screen.getByTestId('custom-edit-mode')).toBeInTheDocument();
    expect(EditModeComponent).toHaveBeenCalledWith({ uploadImage: undefined }, undefined);
  });

  it('resets to view mode when the channel changes', () => {
    const ViewModeComponent = () => <div data-testid='custom-view-mode' />;
    const EditModeComponent = () => <div data-testid='custom-edit-mode' />;
    const channelA = { ...mocks.channel, cid: 'messaging:a' };
    const channelB = { ...mocks.channel, cid: 'messaging:b' };

    const renderForChannel = (channel: typeof channelA) => (
      <ChannelDetailProvider channel={channel as unknown as Channel}>
        <ChannelManagementView
          channelManagementActionSet={[]}
          EditModeComponent={EditModeComponent}
          layout='tabs'
          ViewModeComponent={ViewModeComponent}
        />
      </ChannelDetailProvider>
    );

    const { rerender } = render(renderForChannel(channelA));

    fireEvent.click(screen.getByRole('button', { name: 'Edit chat data' }));
    expect(screen.getByTestId('custom-edit-mode')).toBeInTheDocument();

    rerender(renderForChannel(channelB));

    expect(screen.getByTestId('custom-view-mode')).toBeInTheDocument();
    expect(screen.queryByTestId('custom-edit-mode')).not.toBeInTheDocument();
  });

  it('drops out of edit mode when the edit capability is revoked', () => {
    const ViewModeComponent = () => <div data-testid='custom-view-mode' />;
    const EditModeComponent = () => <div data-testid='custom-edit-mode' />;

    const { rerender } = renderChannelManagementView({
      EditModeComponent,
      ViewModeComponent,
    });

    fireEvent.click(screen.getByRole('button', { name: 'Edit chat data' }));
    expect(screen.getByTestId('custom-edit-mode')).toBeInTheDocument();

    // Capability revoked (e.g. via a channel.updated event).
    mocks.channel.data.own_capabilities = [];
    rerender(
      <ChannelDetailProvider channel={mocks.channel as unknown as Channel}>
        <ChannelManagementView
          channelManagementActionSet={[]}
          EditModeComponent={EditModeComponent}
          layout='tabs'
          ViewModeComponent={ViewModeComponent}
        />
      </ChannelDetailProvider>,
    );

    expect(screen.getByTestId('custom-view-mode')).toBeInTheDocument();
    expect(screen.queryByTestId('custom-edit-mode')).not.toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: 'Edit chat data' }),
    ).not.toBeInTheDocument();
  });

  it('uses custom image upload callback when saving a new image', async () => {
    const uploadImage = vi.fn().mockResolvedValue('https://custom-upload.example');
    const { container } = renderChannelManagementView({ uploadImage });

    fireEvent.click(screen.getByRole('button', { name: 'Edit chat data' }));
    fireEvent.change(container.querySelector('input[type="file"]')!, {
      target: {
        files: [new File(['avatar'], 'avatar.png', { type: 'image/png' })],
      },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Save' }));

    await waitFor(() => expect(uploadImage).toHaveBeenCalledTimes(1));
    expect(mocks.channel.sendImage).not.toHaveBeenCalled();
    expect(mocks.channel.updatePartial).toHaveBeenCalledWith({
      set: { image: 'https://custom-upload.example' },
    });
  });

  describe('edit mode save', () => {
    const enterEditMode = () =>
      fireEvent.click(screen.getByRole('button', { name: 'Edit chat data' }));

    const setName = (value: string) =>
      fireEvent.change(screen.getByRole('textbox'), {
        target: { value },
      });

    const uploadFile = (container: HTMLElement) =>
      fireEvent.change(container.querySelector('input[type="file"]')!, {
        target: { files: [new File(['avatar'], 'avatar.png', { type: 'image/png' })] },
      });

    const save = () => fireEvent.click(screen.getByRole('button', { name: 'Save' }));

    it('persists a name-only change without uploading an image', async () => {
      renderChannelManagementView();

      enterEditMode();
      setName('Renamed channel');
      save();

      await waitFor(() =>
        expect(mocks.channel.updatePartial).toHaveBeenCalledWith({
          set: { name: 'Renamed channel' },
        }),
      );
      expect(mocks.channel.sendImage).not.toHaveBeenCalled();
    });

    it('uploads via channel.sendImage when no custom upload is provided', async () => {
      const { container } = renderChannelManagementView();

      enterEditMode();
      uploadFile(container);
      save();

      await waitFor(() => expect(mocks.channel.sendImage).toHaveBeenCalledTimes(1));
      expect(mocks.channel.updatePartial).toHaveBeenCalledWith({
        set: { image: 'https://stream-upload.example' },
      });
    });

    it('persists both name and image when both change', async () => {
      const { container } = renderChannelManagementView();

      enterEditMode();
      setName('Renamed channel');
      uploadFile(container);
      save();

      await waitFor(() =>
        expect(mocks.channel.updatePartial).toHaveBeenCalledWith({
          set: { image: 'https://stream-upload.example', name: 'Renamed channel' },
        }),
      );
    });

    it('unsets the image when an existing image is deleted', async () => {
      mocks.displayImage = 'https://existing.example';
      renderChannelManagementView();

      enterEditMode();
      fireEvent.click(screen.getByRole('button', { name: 'Delete' }));
      save();

      await waitFor(() =>
        expect(mocks.channel.updatePartial).toHaveBeenCalledWith({
          unset: ['image'],
        }),
      );
      expect(mocks.channel.sendImage).not.toHaveBeenCalled();
    });

    it('emits a success notification after saving', async () => {
      renderChannelManagementView();

      enterEditMode();
      setName('Renamed channel');
      save();

      await waitFor(() =>
        expect(mocks.addNotification).toHaveBeenCalledWith(
          expect.objectContaining({
            message: 'Changes saved',
            severity: 'success',
          }),
        ),
      );
    });

    it('emits an error notification when the update fails', async () => {
      mocks.channel.updatePartial.mockRejectedValueOnce(new Error('boom'));
      renderChannelManagementView();

      enterEditMode();
      setName('Renamed channel');
      save();

      await waitFor(() =>
        expect(mocks.addNotification).toHaveBeenCalledWith(
          expect.objectContaining({
            error: expect.any(Error),
            message: 'Failed to save changes',
            severity: 'error',
          }),
        ),
      );
    });

    it('does not persist when the upload returns no URL', async () => {
      mocks.channel.sendImage.mockResolvedValueOnce({ file: undefined });
      const { container } = renderChannelManagementView();

      enterEditMode();
      uploadFile(container);
      save();

      await waitFor(() =>
        expect(mocks.addNotification).toHaveBeenCalledWith(
          expect.objectContaining({ severity: 'error' }),
        ),
      );
      expect(mocks.channel.updatePartial).not.toHaveBeenCalled();
    });

    it('labels the name field "Contact name" for a DM channel', () => {
      renderChannelManagementView();

      enterEditMode();

      expect(screen.getByLabelText('Contact name')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Contact name')).toBeInTheDocument();
    });

    it('labels the name field "Group name" for a group channel', () => {
      mocks.channel.data.member_count = 5;
      renderChannelManagementView();

      enterEditMode();

      expect(screen.getByLabelText('Group name')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Group name')).toBeInTheDocument();
    });

    it('only renders the save button once something changes', () => {
      renderChannelManagementView();

      enterEditMode();

      expect(screen.queryByRole('button', { name: 'Save' })).not.toBeInTheDocument();

      setName('Renamed channel');
      expect(screen.getByRole('button', { name: 'Save' })).toBeEnabled();
    });
  });
});
