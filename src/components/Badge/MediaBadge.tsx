import { IconMicrophoneSolid, IconVideoFill } from '../Icons';
import React, { type ComponentType } from 'react';
import type { LocalAttachment } from 'stream-chat';
import clsx from 'clsx';

export type MediaBadgeVariant = 'video' | 'voice-recording' | string;

export type MediaBadgeProps = {
  attachment: LocalAttachment;
  variant: 'video' | 'voice-recording' | string;
};

const MediaBadgeVariantToIcon: Record<MediaBadgeVariant, ComponentType> = {
  video: IconVideoFill,
  voiceRecording: IconMicrophoneSolid,
};

export const MediaBadge = ({ attachment, variant }: MediaBadgeProps) => {
  const Icon = MediaBadgeVariantToIcon[variant];
  return (
    <div
      className={clsx('str-chat__media-badge', {
        [`str-chat__media-badge--${variant}`]: variant,
      })}
    >
      {Icon && <Icon />}
      {attachment.duration && <div>{attachment.duration}</div>}
    </div>
  );
};
