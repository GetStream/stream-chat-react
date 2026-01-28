import React from 'react';
import { iconMap } from './iconMap';
import { mimeTypeToExtensionMap } from './mimeTypes';

export type FileIconProps = {
  className?: string;
  fileName?: string;
  mimeType?: string;
};

export function mimeTypeToIcon(mimeType?: string) {
  const theMap = iconMap['standard'];

  if (!mimeType) return theMap.fallback;

  const icon = theMap[mimeType];
  if (icon) return icon;

  if (mimeType.startsWith('audio/')) return theMap['audio/'];
  if (mimeType.startsWith('video/')) return theMap['video/'];
  if (mimeType.startsWith('image/')) return theMap['image/'];
  if (mimeType.startsWith('text/')) return theMap['text/'];

  return theMap.fallback;
}

const labelFromMimeType = ({
  fileName,
  mimeType,
}: Pick<FileIconProps, 'fileName' | 'mimeType'>) => {
  let label;

  if (mimeType) {
    label = mimeTypeToExtensionMap[mimeType];
  }

  if (!label && fileName) {
    label = fileName.split('.').slice(-1)[0];
  }
  return label;
};

export const FileIcon = (props: FileIconProps) => {
  const { fileName, mimeType, ...rest } = props;

  const Icon = mimeTypeToIcon(mimeType);
  const label = labelFromMimeType({ fileName, mimeType });
  return <Icon {...rest} label={label} />;
};
