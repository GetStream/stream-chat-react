import * as fileIconSet from './FileIconSet';
import type { GeneralType, SupportedMimeType } from './mimeTypes';
import {
  archiveFileTypes,
  codeFileTypes,
  excelMimeTypes,
  powerpointMimeTypes,
  wordMimeTypes,
} from './mimeTypes';
import type { ComponentType } from 'react';
import type { IconProps } from './FileIconSet';

type MimeTypeMappedComponent =
  | 'FilePdfIcon'
  | 'FileWordIcon'
  | 'FileExcelIcon'
  | 'FilePowerPointIcon'
  | 'FileArchiveIcon'
  | 'FileCodeIcon';

type GeneralContentTypeComponent = 'FileAudioIcon' | 'FileVideoIcon' | 'FileAltIcon';

type IconComponents<Props> = {
  FileAltIcon: ComponentType<Props>;
  FileArchiveIcon: ComponentType<Props>;
  FileAudioIcon: ComponentType<Props>;
  FileCodeIcon: ComponentType<Props>;
  FileExcelIcon: ComponentType<Props>;
  FileFallbackIcon: ComponentType<Props>;
  FilePdfIcon: ComponentType<Props>;
  FilePowerPointIcon: ComponentType<Props>;
  FileVideoIcon: ComponentType<Props>;
  FileWordIcon: ComponentType<Props>;
};

type MimeTypeToIconMap<Props> = {
  [key: string]: ComponentType<Props>;
};

function generateMimeTypeToIconMap<Props>({
  FileArchiveIcon,
  FileCodeIcon,
  FileExcelIcon,
  FilePdfIcon,
  FilePowerPointIcon,
  FileWordIcon,
}: Pick<IconComponents<Props>, MimeTypeMappedComponent>) {
  const mimeTypeToIconMap: MimeTypeToIconMap<Props> = {
    'application/pdf': FilePdfIcon,
  };

  for (const type of wordMimeTypes) {
    mimeTypeToIconMap[type] = FileWordIcon;
  }

  for (const type of excelMimeTypes) {
    mimeTypeToIconMap[type] = FileExcelIcon;
  }

  for (const type of powerpointMimeTypes) {
    mimeTypeToIconMap[type] = FilePowerPointIcon;
  }

  for (const type of archiveFileTypes) {
    mimeTypeToIconMap[type] = FileArchiveIcon;
  }

  for (const type of codeFileTypes) {
    mimeTypeToIconMap[type] = FileCodeIcon;
  }
  return mimeTypeToIconMap;
}

function generateGeneralTypeToIconMap<Props>({
  FileAltIcon,
  FileAudioIcon,
  FileVideoIcon,
}: Pick<IconComponents<Props>, GeneralContentTypeComponent>) {
  return {
    'audio/': FileAudioIcon,
    'text/': FileAltIcon,
    'video/': FileVideoIcon,
  };
}

type IconMap = {
  standard: Record<
    SupportedMimeType | GeneralType | 'fallback',
    ComponentType<IconProps>
  >;
};

export const iconMap: IconMap = {
  standard: {
    ...generateMimeTypeToIconMap<IconProps>({
      FileArchiveIcon: fileIconSet.FileArchiveIcon,
      FileCodeIcon: fileIconSet.FileCodeIcon,
      FileExcelIcon: fileIconSet.FileExcelIcon,
      FilePdfIcon: fileIconSet.FilePdfIcon,
      FilePowerPointIcon: fileIconSet.FilePowerPointIcon,
      FileWordIcon: fileIconSet.FileWordIcon,
    }),
    ...generateGeneralTypeToIconMap<IconProps>({
      FileAltIcon: fileIconSet.FileFallbackIcon,
      FileAudioIcon: fileIconSet.FileAudioIcon,
      FileVideoIcon: fileIconSet.FileVideoIcon,
    }),
    fallback: fileIconSet.FileFallbackIcon,
  },
};
