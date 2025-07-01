import React from 'react';

import type { IconType } from './iconMap';
import { iconMap } from './iconMap';

export type FileIconProps = {
  big?: boolean;
  className?: string;
  filename?: string;
  mimeType?: string;
  size?: number; // big icon on sent attachment
  sizeSmall?: number; // small icon on file upload preview
  type?: IconType;
};

export function mimeTypeToIcon(type: IconType = 'standard', mimeType?: string) {
  const theMap = iconMap[type] || iconMap['standard'];

  if (!mimeType) return theMap.fallback;

  const icon = theMap[mimeType];
  if (icon) return icon;

  if (mimeType.startsWith('audio/')) return theMap['audio/'];
  if (mimeType.startsWith('video/')) return theMap['video/'];
  if (mimeType.startsWith('image/')) return theMap['image/'];
  if (mimeType.startsWith('text/')) return theMap['text/'];

  return theMap.fallback;
}

export const FileIcon = (props: FileIconProps) => {
  const {
    big = false,
    mimeType,
    size = 50,
    sizeSmall = 20,
    type = 'standard',
    ...rest
  } = props;

  const Icon = mimeTypeToIcon(type, mimeType);

  return <Icon {...rest} size={big ? size : sizeSmall} />;
};
