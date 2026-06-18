import React, {
  type SyntheticEvent,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

import {
  useChatContext,
  useComponentContext,
  useModalContext,
  useTranslationContext,
} from '../../../../context';
import { isDmChannel } from '../../../../utils';
import {
  SectionNavigatorHeader,
  type SectionNavigatorSectionContentProps,
} from '../../SectionNavigator';
import { ChannelAvatar as DefaultChannelAvatar } from '../../../../components/Avatar';
import {
  useChannelPreviewInfo,
  useIsUserMuted,
} from '../../../../components/ChannelListItem';
import { IconCheckmark, IconMute, IconPin } from '../../../../components/Icons';
import { useChannelMembershipState } from '../../../../components/ChannelList';
import { useIsChannelMuted } from '../../../../components/ChannelListItem/hooks/useIsChannelMuted';
import { useChannelHasMembersOnline } from '../../../../components/ChannelHeader/hooks/useChannelHasMembersOnline';
import { Prompt } from '../../../../components/Dialog';
import {
  type ChannelManagementActionItem,
  defaultChannelManagementActionSet,
  useBaseChannelManagementActionSetFilter,
} from './ChannelManagementActions.defaults';
import { useChannelHeaderOnlineStatus } from '../../../../components/ChannelHeader/hooks/useChannelHeaderOnlineStatus';
import { useChannelDetailContext } from '../../ChannelDetailContext';
import { Button } from '../../../../components/Button';
import { TextInput } from '../../../../components/Form';
import { useNotificationApi } from '../../../../components/Notifications/hooks/useNotificationApi';

export type ChannelManagementViewProps = SectionNavigatorSectionContentProps & {
  channelManagementActionSet?: ChannelManagementActionItem[];
  EditModeComponent?: React.ComponentType<ChannelManagementEditBodyProps>;
  uploadImage?: ChannelManagementImageUpload;
  ViewModeComponent?: React.ComponentType<ChannelManagementInfoBodyProps>;
};

export type ChannelManagementImageUpload = (file: File) => Promise<string> | string;

export type ChannelManagementInfoBodyProps = {
  actions: ChannelManagementActionItem[];
};

export const ChannelManagementInfoBody = ({
  actions,
}: ChannelManagementInfoBodyProps) => {
  const { client } = useChatContext();
  const { channel } = useChannelDetailContext();
  const { Avatar = DefaultChannelAvatar } = useComponentContext();
  const { displayImage, displayTitle, groupChannelDisplayInfo } = useChannelPreviewInfo({
    channel,
  });
  const resolvedIsDmChannel = isDmChannel({
    channel,
    ownUserId: client.user?.id,
  });
  const otherMemberUserId = useMemo(() => {
    if (!resolvedIsDmChannel) return;

    return Object.values(channel.state?.members ?? {}).find(
      (member) => member.user?.id && member.user.id !== client.user?.id,
    )?.user?.id;
  }, [channel, client.user?.id, resolvedIsDmChannel]);
  const isOnline = useChannelHasMembersOnline({ channel });
  const { muted: channelMuted } = useIsChannelMuted(channel);
  const userMuted = useIsUserMuted(otherMemberUserId);
  const membership = useChannelMembershipState(channel);
  const onlineStatusText = useChannelHeaderOnlineStatus({ channel });
  const pinned = !!membership.pinned_at;

  return (
    <Prompt.Body className='str-chat__channel-detail__channel-management-view__body'>
      <div className='str-chat__channel-detail__channel-management-view__profile'>
        <Avatar
          displayMembers={groupChannelDisplayInfo.members}
          imageUrl={displayImage}
          isOnline={resolvedIsDmChannel ? isOnline : undefined}
          size='2xl'
          userName={displayTitle}
        />
        <div className='str-chat__channel-detail__channel-management-view__profile__details'>
          <div className='str-chat__channel-detail__channel-management-view__profile__details__title'>
            {displayTitle && <span>{displayTitle}</span>}
            {pinned && <IconPin />}
            {(resolvedIsDmChannel && userMuted) ||
            (!resolvedIsDmChannel && channelMuted) ? (
              <IconMute />
            ) : null}
          </div>
          {onlineStatusText && (
            <div className='str-chat__channel-detail__channel-management-view__profile__details__connection-status'>
              {onlineStatusText}
            </div>
          )}
        </div>
      </div>

      <div className='str-chat__channel-detail__channel-management-view__actions str-chat__form__switch-fieldset'>
        {actions.map(({ Component, type }) => (
          <Component key={type} />
        ))}
      </div>
    </Prompt.Body>
  );
};

export type ChannelManagementEditBodyProps = {
  uploadImage?: ChannelManagementImageUpload;
};

const EDIT_BODY_EMITTER = 'ChannelManagementEditBody';

type ChannelUpdatePayload = {
  set?: { image?: string; name?: string };
  unset?: ['image'];
};

/**
 * Assembles the argument for `channel.updatePartial` from the pending edits,
 * or returns `null` when there is nothing to persist. `image` is a tri-state:
 * a string sets a new avatar, `null` clears it, `undefined` leaves it untouched.
 */
const buildChannelUpdatePayload = ({
  image,
  name,
}: {
  image?: string | null;
  name?: string;
}): ChannelUpdatePayload | null => {
  const payload: ChannelUpdatePayload = {};

  const set: { image?: string; name?: string } = {};
  if (name !== undefined) set.name = name;
  if (typeof image === 'string') set.image = image;
  if (Object.keys(set).length > 0) payload.set = set;

  if (image === null) payload.unset = ['image'];

  return Object.keys(payload).length > 0 ? payload : null;
};

/**
 * Owns the channel-edit form: field state, the local image preview lifecycle,
 * the derived "can save" flags, and the save orchestration (upload → persist →
 * notify). The component is left to render the values this returns.
 */
const useChannelManagementEditForm = ({
  uploadImage,
}: ChannelManagementEditBodyProps) => {
  const { t } = useTranslationContext();
  const { client } = useChatContext();
  const { channel } = useChannelDetailContext();
  const { displayImage, displayTitle, groupChannelDisplayInfo } = useChannelPreviewInfo({
    channel,
  });
  const { addNotification } = useNotificationApi();

  const resolvedIsDmChannel = isDmChannel({ channel, ownUserId: client.user?.id });
  const hasMembersOnline = useChannelHasMembersOnline({ channel });
  const isOnline = resolvedIsDmChannel ? hasMembersOnline : undefined;
  const nameLabel = resolvedIsDmChannel ? t('Contact name') : t('Group name');

  const initialName = channel.data?.name ?? '';
  const [name, setName] = useState(initialName);
  // null = keep current avatar, File = replace it, 'removed' = clear it
  const [imageEdit, setImageEdit] = useState<File | 'removed' | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const pickedFile = imageEdit instanceof File ? imageEdit : null;

  // Preview the locally picked file, releasing the object URL when it changes or unmounts.
  const objectUrl = useMemo(
    () => (pickedFile ? URL.createObjectURL(pickedFile) : null),
    [pickedFile],
  );

  useEffect(
    () => () => {
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    },
    [objectUrl],
  );

  const previewImageUrl =
    objectUrl ?? (imageEdit === 'removed' ? undefined : displayImage);

  const trimmedName = name.trim();
  const nameChanged = trimmedName !== initialName.trim();
  const imageChanged = imageEdit !== null;
  const hasChanges = (trimmedName.length > 0 && nameChanged) || imageChanged;
  const canSubmit = trimmedName.length > 0 && !isSaving && hasChanges;

  const handleOpenFilePicker = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleFileChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) setImageEdit(file);
    event.target.value = '';
  }, []);

  const handleDeleteImage = useCallback(() => setImageEdit('removed'), []);

  const resolveImageUrl = useCallback(
    async (file: File) => {
      const url = uploadImage
        ? await uploadImage(file)
        : (await channel.sendImage(file)).file;
      if (!url) throw new Error('Image upload did not return a URL');
      return url;
    },
    [channel, uploadImage],
  );

  const handleSubmit = useCallback(
    async (event: SyntheticEvent<HTMLFormElement>) => {
      event.preventDefault();
      if (!canSubmit) return;

      setIsSaving(true);
      try {
        let image: string | null | undefined;
        if (pickedFile) image = await resolveImageUrl(pickedFile);
        else if (imageEdit === 'removed') image = null;

        const payload = buildChannelUpdatePayload({
          image,
          name: nameChanged ? trimmedName : undefined,
        });
        if (payload) await channel.updatePartial(payload);

        setImageEdit(null);

        addNotification({
          duration: 3000,
          emitter: EDIT_BODY_EMITTER,
          incident: {
            domain: 'channel',
            entity: 'channel',
            operation: 'update',
            status: 'success',
          },
          message: t('Changes saved'),
          severity: 'success',
        });
      } catch (error) {
        addNotification({
          emitter: EDIT_BODY_EMITTER,
          error: error instanceof Error ? error : undefined,
          incident: {
            domain: 'api',
            entity: 'channel',
            operation: 'update',
            status: 'failed',
          },
          message: t('Failed to save changes'),
          severity: 'error',
        });
      } finally {
        setIsSaving(false);
      }
    },
    [
      addNotification,
      canSubmit,
      channel,
      imageEdit,
      nameChanged,
      pickedFile,
      resolveImageUrl,
      t,
      trimmedName,
    ],
  );

  return {
    canSubmit,
    displayTitle,
    fileInputRef,
    groupChannelDisplayInfo,
    handleDeleteImage,
    handleFileChange,
    handleOpenFilePicker,
    handleSubmit,
    hasAvatarImage: !!previewImageUrl,
    isOnline,
    name,
    nameLabel,
    previewImageUrl,
    setName,
    t,
    trimmedName,
  };
};

export const ChannelManagementEditBody = (props: ChannelManagementEditBodyProps) => {
  const { Avatar = DefaultChannelAvatar } = useComponentContext();
  const {
    canSubmit,
    displayTitle,
    fileInputRef,
    groupChannelDisplayInfo,
    handleDeleteImage,
    handleFileChange,
    handleOpenFilePicker,
    handleSubmit,
    hasAvatarImage,
    isOnline,
    name,
    nameLabel,
    previewImageUrl,
    setName,
    t,
    trimmedName,
  } = useChannelManagementEditForm(props);

  return (
    <form
      className='str-chat__channel-detail__channel-management-view__form'
      onSubmit={handleSubmit}
    >
      <Prompt.Body className='str-chat__channel-detail__channel-management-view__body'>
        <div className='str-chat__channel-detail__channel-management-view__avatar-row'>
          <Avatar
            displayMembers={groupChannelDisplayInfo.members}
            imageUrl={previewImageUrl}
            isOnline={isOnline}
            size='2xl'
            userName={trimmedName || displayTitle}
          />
          <div className='str-chat__channel-detail__channel-management-view__avatar-row__actions'>
            <Button
              appearance='outline'
              onClick={handleOpenFilePicker}
              size='sm'
              type='button'
              variant='secondary'
            >
              {t('Upload Picture')}
            </Button>
            {hasAvatarImage && (
              <Button
                appearance='outline'
                onClick={handleDeleteImage}
                size='sm'
                type='button'
                variant='secondary'
              >
                {t('Delete')}
              </Button>
            )}
            <input
              accept='image/*'
              aria-hidden
              className='str-chat__channel-detail__channel-management-view__file-input'
              onChange={handleFileChange}
              ref={fileInputRef}
              tabIndex={-1}
              type='file'
            />
          </div>
        </div>

        <TextInput
          aria-label={nameLabel}
          autoFocus
          className='str-chat__channel-detail__channel-management-view__name-input'
          maxLength={255}
          onChange={(event) => setName(event.target.value)}
          placeholder={nameLabel}
          value={name}
        />
      </Prompt.Body>

      <Prompt.Footer className='str-chat__channel-detail__channel-management-view__footer'>
        <Prompt.FooterControls>
          {canSubmit && (
            <Prompt.FooterControlsButtonPrimary
              className='str-chat__channel-detail__channel-management-view__footer__save-button'
              type='submit'
            >
              <IconCheckmark />
              {t('Save')}
            </Prompt.FooterControlsButtonPrimary>
          )}
        </Prompt.FooterControls>
      </Prompt.Footer>
    </form>
  );
};

export const ChannelManagementView = ({
  channelManagementActionSet = defaultChannelManagementActionSet,
  EditModeComponent = ChannelManagementEditBody,
  uploadImage,
  ViewModeComponent = ChannelManagementInfoBody,
}: ChannelManagementViewProps) => {
  const { t } = useTranslationContext();
  const { client } = useChatContext();
  const { channel } = useChannelDetailContext();
  const { close } = useModalContext();
  const resolvedIsDmChannel = isDmChannel({
    channel,
    ownUserId: client.user?.id,
  });
  const actions = useBaseChannelManagementActionSetFilter(channelManagementActionSet);
  const [isEditing, setIsEditing] = useState(false);
  const canEditChannel = channel.data?.own_capabilities?.includes('update-channel');
  // Edit mode requires the capability: revoking it (or swapping channels) must
  // drop back to view mode so the form cannot keep editing/submitting.
  const isEditMode = isEditing && canEditChannel;

  useEffect(() => {
    setIsEditing(false);
  }, [channel.cid]);

  const EditChannelButton = useMemo(
    () =>
      function EditChannelButton() {
        return (
          <Button
            appearance='outline'
            aria-label={t('Edit chat data')}
            className='str-chat__channel-detail__channel-management-view__edit-button'
            onClick={() => {
              setIsEditing(true);
            }}
            size='md'
            variant='secondary'
          >
            {t('Edit')}
          </Button>
        );
      },
    [t],
  );

  const headerTitle = isEditMode
    ? resolvedIsDmChannel
      ? t('Edit contact')
      : t('Edit group')
    : resolvedIsDmChannel
      ? t('Contact info')
      : t('Group info');

  return (
    <div className='str-chat__channel-detail__channel-management-view'>
      <SectionNavigatorHeader
        close={close}
        description={isEditMode ? undefined : t('Manage channel')}
        goBack={isEditMode ? () => setIsEditing(false) : undefined}
        title={headerTitle}
        TrailingContent={!isEditMode && canEditChannel ? EditChannelButton : undefined}
      />
      {isEditMode ? (
        <EditModeComponent uploadImage={uploadImage} />
      ) : (
        <ViewModeComponent actions={actions} />
      )}
    </div>
  );
};
