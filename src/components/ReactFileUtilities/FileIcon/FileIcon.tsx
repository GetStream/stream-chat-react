import React from 'react';

import { iconMap, IconType, IconVersion } from './iconMap';

export type FileIconProps = {
  big?: boolean;
  className?: string;
  filename?: string;
  mimeType?: string;
  size?: number; // big icon on sent attachment
  sizeSmall?: number; // small icon on file upload preview
  type?: IconType;
  version?: IconVersion;
};

export function mimeTypeToIcon(
  type: IconType = 'standard',
  version: IconVersion = '1',
  mimeType?: string,
) {
  const theMap = iconMap[version]?.[type] || iconMap[version]['standard'];

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
    version = '1',
    ...rest
  } = props;

  const Icon = mimeTypeToIcon(type, version, mimeType);

  return <Icon {...rest} size={big ? size : sizeSmall} />;
};
