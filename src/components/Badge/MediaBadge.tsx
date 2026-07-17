import { useComponentContext } from '../../context';
import {
  IconMicrophoneSolid as DefaultIconMicrophoneSolid,
  IconVideoFill as DefaultIconVideoFill,
} from '../Icons';
import React, { type ComponentType } from 'react';
import type { LocalAttachment } from 'stream-chat';
import clsx from 'clsx';

export type MediaBadgeVariant = 'video' | 'voice-recording' | string;

export type MediaBadgeProps = {
  attachment: LocalAttachment;
  variant: 'video' | 'voice-recording' | string;
};

export const MediaBadge = ({ attachment, variant }: MediaBadgeProps) => {
  const {
    icons: {
      IconMicrophoneSolid = DefaultIconMicrophoneSolid,
      IconVideoFill = DefaultIconVideoFill,
    } = {},
  } = useComponentContext();

  const mediaBadgeVariantToIcon: Record<MediaBadgeVariant, ComponentType> = {
    video: IconVideoFill,
    voiceRecording: IconMicrophoneSolid,
  };

  const Icon = mediaBadgeVariantToIcon[variant];
  return (
    <div
      className={clsx('str-chat__media-badge', {
        [`str-chat__media-badge--${variant}`]: variant,
      })}
    >
      {Icon && <Icon />}
      {attachment.duration ? <div>{attachment.duration}</div> : null}
    </div>
  );
};
