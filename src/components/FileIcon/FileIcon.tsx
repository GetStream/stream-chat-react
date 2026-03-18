import React, { useMemo } from 'react';
import clsx from 'clsx';
import { iconMap } from './iconMap';
import { FILE_ICON_NO_LABEL_CLASSNAME, mergeFileIconSizeConfig } from './FileIconSet';
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
  /** When true, label is not rendered and the icon graphic is centered (adds str-chat__file-icon--no-label). */
  hideLabel?: boolean;
  mimeType?: string;
  /** Override dimensions/label position per size (sm, md, lg). */
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
    hideLabel,
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
  const label = hideLabel ? undefined : labelFromMimeType({ fileName, mimeType });
  return (
    <Icon
      {...rest}
      className={clsx(className, hideLabel && FILE_ICON_NO_LABEL_CLASSNAME)}
      label={label}
      size={size}
      sizeConfig={sizeConfig}
    />
  );
};
