import { useComponentContextIcons } from '../../context';
import React, { type ComponentType } from 'react';
import type { LocalAttachment, LocalVoiceRecordingAttachment } from 'stream-chat';
import clsx from 'clsx';

export type MediaBadgeVariant = 'video' | 'voice-recording' | string;

export type MediaBadgeProps = {
  attachment: LocalAttachment;
  variant: 'video' | 'voice-recording' | string;
};

export const MediaBadge = ({ attachment, variant }: MediaBadgeProps) => {
  const { IconMicrophoneSolid, IconVideoFill } = useComponentContextIcons();

  const mediaBadgeVariantToIcon: Record<MediaBadgeVariant, ComponentType> = {
    video: IconVideoFill,
    voiceRecording: IconMicrophoneSolid,
  };

  const Icon = mediaBadgeVariantToIcon[variant];
  const { duration } = (attachment as LocalVoiceRecordingAttachment).custom ?? {};
  return (
    <div
      className={clsx('str-chat__media-badge', {
        [`str-chat__media-badge--${variant}`]: variant,
      })}
    >
      {Icon && <Icon />}
      {duration ? <div>{duration}</div> : null}
    </div>
  );
};
