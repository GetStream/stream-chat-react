import React, { useMemo } from 'react';
import { iconMap } from './iconMap';
import { mergeFileIconSizeConfig } from './FileIconSet';
import { mimeTypeToExtensionMap } from './mimeTypes';
import type { FileIconSize } from './FileIconSet';

export type FileIconSizeConfigOverride = Partial<
  Record<
    FileIconSize,
    Partial<{ width: number; height: number; labelX: number; labelY: number }>
  >
>;

export type FileIconProps = {
  className?: string;
  fileName?: string;
  mimeType?: string;
  /** Override dimensions/label position per size (sm, md, lg, xl). */
  sizeConfig?: FileIconSizeConfigOverride;
  size?: FileIconSize;
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
  const {
    className,
    fileName,
    mimeType,
    size = 'md',
    sizeConfig: sizeConfigOverride,
    ...rest
  } = props;
  const sizeConfig = useMemo(
    () => mergeFileIconSizeConfig(sizeConfigOverride),
    [sizeConfigOverride],
  );
  const Icon = mimeTypeToIcon(mimeType);
  const label = fileName ? labelFromMimeType({ fileName, mimeType }) : undefined;
  return (
    <Icon
      {...rest}
      className={className}
      label={label}
      size={size}
      sizeConfig={sizeConfig}
    />
  );
};
