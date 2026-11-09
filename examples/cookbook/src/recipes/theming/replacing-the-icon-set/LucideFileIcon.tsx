import {
  File,
  FileArchive,
  FileHeadphone,
  FileImage,
  FileSpreadsheet,
  FileText,
  FileVideoCamera,
  type LucideIcon,
} from 'lucide-react';
import type { FileIconProps } from 'stream-chat-react';

// Spreadsheets first, so `text/csv` doesn't fall under `text/`.
const iconForMimeType = (mimeType = ''): LucideIcon => {
  if (/spreadsheet|excel|csv/.test(mimeType)) return FileSpreadsheet;
  if (/zip|compressed|tar/.test(mimeType)) return FileArchive;
  if (mimeType.startsWith('image/')) return FileImage;
  if (mimeType.startsWith('audio/')) return FileHeadphone;
  if (mimeType.startsWith('video/')) return FileVideoCamera;
  if (mimeType.startsWith('text/') || mimeType === 'application/pdf') return FileText;
  return File;
};

type FileIconSize = NonNullable<FileIconProps['size']>;

// The heights of the SDK's file icon sizes, in px. Lucide's icons are square.
const heightBySize: Record<FileIconSize, number> = { lg: 40, md: 32, sm: 24, xl: 48 };

/** The file-type icon on a file attachment, picked from the file's MIME type. */
export const LucideFileIcon = ({
  className,
  mimeType,
  size = 'md',
  sizeConfig,
}: FileIconProps) => {
  const Icon = iconForMimeType(mimeType);
  return (
    <Icon
      aria-hidden
      className={`${className ?? ''} cookbook-file-icon`}
      size={sizeConfig?.[size]?.height ?? heightBySize[size]}
    />
  );
};
