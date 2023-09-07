import type { ComponentType } from 'react';

import * as v1 from './FileIconSet/v1';
import type { IconPropsV1 } from './FileIconSet/v1';
import * as v2 from './FileIconSet/v2';
import type { IconPropsV2 } from './FileIconSet/v2';
import {
  archiveFileTypes,
  codeFileTypes,
  excelMimeTypes,
  GeneralType,
  powerpointMimeTypes,
  SupportedMimeType,
  wordMimeTypes,
} from './mimeTypes';

type MimeTypeMappedComponent =
  | 'FilePdfIcon'
  | 'FileWordIcon'
  | 'FileExcelIcon'
  | 'FilePowerPointIcon'
  | 'FileArchiveIcon'
  | 'FileCodeIcon';

type GeneralContentTypeComponent =
  | 'FileImageIcon'
  | 'FileAudioIcon'
  | 'FileVideoIcon'
  | 'FileAltIcon';

type IconComponents<Props> = {
  FileAltIcon: ComponentType<Props>;
  FileArchiveIcon: ComponentType<Props>;
  FileAudioIcon: ComponentType<Props>;
  FileCodeIcon: ComponentType<Props>;
  FileExcelIcon: ComponentType<Props>;
  FileFallbackIcon: ComponentType<Props>;
  FileImageIcon: ComponentType<Props>;
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
  FileImageIcon,
  FileVideoIcon,
}: Pick<IconComponents<Props>, GeneralContentTypeComponent>) {
  return {
    'audio/': FileAudioIcon,
    'image/': FileImageIcon,
    'text/': FileAltIcon,
    'video/': FileVideoIcon,
  };
}

export type IconType = 'standard' | 'alt';
export type IconVersion = '1' | '2';

type IconProps = {
  '1': IconPropsV1;
  '2': IconPropsV2;
};

type IconMap = {
  [v in IconVersion]: {
    standard: Record<SupportedMimeType | GeneralType | 'fallback', ComponentType<IconProps[v]>>;
    alt?: Record<SupportedMimeType | GeneralType | 'fallback', ComponentType<IconProps[v]>>;
  };
};

export const iconMap: IconMap = {
  '1': {
    alt: {},
    standard: {
      ...generateMimeTypeToIconMap<IconPropsV1>({
        FileArchiveIcon: v1.FileArchiveIcon,
        FileCodeIcon: v1.FileCodeIcon,
        FileExcelIcon: v1.FileExcelIcon,
        FilePdfIcon: v1.FilePdfIcon,
        FilePowerPointIcon: v1.FilePowerPointIcon,
        FileWordIcon: v1.FileWordIcon,
      }),
      ...generateGeneralTypeToIconMap<IconPropsV1>({
        FileAltIcon: v1.FileAltIcon,
        FileAudioIcon: v1.FileAudioIcon,
        FileImageIcon: v1.FileImageIcon,
        FileVideoIcon: v1.FileVideoIcon,
      }),
      fallback: v1.FileFallbackIcon,
    },
  },
  '2': {
    alt: {
      ...generateMimeTypeToIconMap<IconPropsV2>({
        FileArchiveIcon: v2.FileArchiveIconAlt,
        FileCodeIcon: v2.FileCodeIconAlt,
        FileExcelIcon: v2.FileExcelIconAlt,
        FilePdfIcon: v2.FilePdfIcon,
        FilePowerPointIcon: v2.FilePowerPointIconAlt,
        FileWordIcon: v2.FileWordIconAlt,
      }),
      ...generateGeneralTypeToIconMap<IconPropsV2>({
        FileAltIcon: v2.FileFallbackIcon,
        FileAudioIcon: v2.FileAudioIconAlt,
        FileImageIcon: v2.FileImageIcon,
        FileVideoIcon: v2.FileVideoIconAlt,
      }),
      fallback: v2.FileFallbackIcon,
    },
    standard: {
      ...generateMimeTypeToIconMap<IconPropsV2>({
        FileArchiveIcon: v2.FileArchiveIcon,
        FileCodeIcon: v2.FileCodeIcon,
        FileExcelIcon: v2.FileExcelIcon,
        FilePdfIcon: v2.FilePdfIcon,
        FilePowerPointIcon: v2.FilePowerPointIcon,
        FileWordIcon: v2.FileWordIcon,
      }),
      ...generateGeneralTypeToIconMap<IconPropsV2>({
        FileAltIcon: v2.FileFallbackIcon,
        FileAudioIcon: v2.FileAudioIcon,
        FileImageIcon: v2.FileImageIcon,
        FileVideoIcon: v2.FileVideoIcon,
      }),
      fallback: v2.FileFallbackIcon,
    },
  },
};
