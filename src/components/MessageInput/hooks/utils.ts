import type { AppSettingsAPIResponse, FileUploadConfig, UserResponse } from 'stream-chat';

import type { ChannelActionContextValue } from '../../../context/ChannelActionContext';
import type { ChatContextValue } from '../../../context/ChatContext';
import type { TranslationContextValue } from '../../../context/TranslationContext';

import { DEFAULT_UPLOAD_SIZE_LIMIT_BYTES } from '../../../constants/limits';

export const accentsMap: { [key: string]: string } = {
  a: 'á|à|ã|â|À|Á|Ã|Â',
  c: 'ç|Ç',
  e: 'é|è|ê|É|È|Ê',
  i: 'í|ì|î|Í|Ì|Î',
  n: 'ñ|Ñ',
  o: 'ó|ò|ô|ő|õ|Ó|Ò|Ô|Õ',
  u: 'ú|ù|û|ü|Ú|Ù|Û|Ü',
};

export const removeDiacritics = (text?: string) => {
  if (!text) return '';
  return Object.keys(accentsMap).reduce(
    (acc, current) => acc.replace(new RegExp(accentsMap[current], 'g'), current),
    text,
  );
};

export const calculateLevenshtein = (query: string, name: string) => {
  if (query.length === 0) return name.length;
  if (name.length === 0) return query.length;

  const matrix = [];

  let i;
  for (i = 0; i <= name.length; i++) {
    matrix[i] = [i];
  }

  let j;
  for (j = 0; j <= query.length; j++) {
    matrix[0][j] = j;
  }

  for (i = 1; i <= name.length; i++) {
    for (j = 1; j <= query.length; j++) {
      if (name.charAt(i - 1) === query.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1, // substitution
          Math.min(
            matrix[i][j - 1] + 1, // insertion
            matrix[i - 1][j] + 1,
          ),
        ); // deletion
      }
    }
  }

  return matrix[name.length][query.length];
};

export type SearchLocalUserParams = {
  ownUserId: string | undefined;
  query: string;
  text: string;
  users: UserResponse[];
  useMentionsTransliteration?: boolean;
};

export const searchLocalUsers = (params: SearchLocalUserParams): UserResponse[] => {
  const { ownUserId, query, text, useMentionsTransliteration, users } = params;

  const matchingUsers = users.filter((user) => {
    if (user.id === ownUserId) return false;
    if (!query) return true;

    let updatedId = removeDiacritics(user.id).toLowerCase();
    let updatedName = removeDiacritics(user.name).toLowerCase();
    let updatedQuery = removeDiacritics(query).toLowerCase();

    if (useMentionsTransliteration) {
      (async () => {
        // eslint-disable-next-line import/no-extraneous-dependencies
        const { default: transliterate } = await import('@stream-io/transliterate');
        updatedName = transliterate(user.name || '').toLowerCase();
        updatedQuery = transliterate(query).toLowerCase();
        updatedId = transliterate(user.id).toLowerCase();
      })();
    }

    const maxDistance = 3;
    const lastDigits = text.slice(-(maxDistance + 1)).includes('@');

    if (updatedName) {
      const levenshtein = calculateLevenshtein(updatedQuery, updatedName);
      if (
        updatedName.includes(updatedQuery) ||
        (levenshtein <= maxDistance && lastDigits)
      ) {
        return true;
      }
    }

    const levenshtein = calculateLevenshtein(updatedQuery, updatedId);

    return updatedId.includes(updatedQuery) || (levenshtein <= maxDistance && lastDigits);
  });

  return matchingUsers;
};

type CheckUploadPermissionsParams = {
  addNotification: ChannelActionContextValue['addNotification'];
  file: File;
  getAppSettings: ChatContextValue['getAppSettings'];
  t: TranslationContextValue['t'];
  uploadType: 'image' | 'file';
};

export const checkUploadPermissions = async (params: CheckUploadPermissionsParams) => {
  const { addNotification, file, getAppSettings, t, uploadType } = params;

  let appSettings: AppSettingsAPIResponse | null = null;
  appSettings = await getAppSettings();

  const {
    allowed_file_extensions,
    allowed_mime_types,
    blocked_file_extensions,
    blocked_mime_types,
    size_limit,
  } =
    ((uploadType === 'image'
      ? appSettings?.app?.image_upload_config
      : appSettings?.app?.file_upload_config) as FileUploadConfig) || {};

  const sendNotAllowedErrorNotification = () =>
    addNotification(
      t(`Upload type: "{{ type }}" is not allowed`, {
        type: file.type || 'unknown type',
      }),
      'error',
    );

  if (allowed_file_extensions?.length) {
    const allowed = allowed_file_extensions.some((ext) =>
      file.name.toLowerCase().endsWith(ext.toLowerCase()),
    );

    if (!allowed) {
      sendNotAllowedErrorNotification();
      return false;
    }
  }

  if (blocked_file_extensions?.length) {
    const blocked = blocked_file_extensions.some((ext) =>
      file.name.toLowerCase().endsWith(ext.toLowerCase()),
    );

    if (blocked) {
      sendNotAllowedErrorNotification();
      return false;
    }
  }

  if (allowed_mime_types?.length) {
    const allowed = allowed_mime_types.some(
      (type) => type.toLowerCase() === file.type?.toLowerCase(),
    );

    if (!allowed) {
      sendNotAllowedErrorNotification();
      return false;
    }
  }

  if (blocked_mime_types?.length) {
    const blocked = blocked_mime_types.some(
      (type) => type.toLowerCase() === file.type?.toLowerCase(),
    );

    if (blocked) {
      sendNotAllowedErrorNotification();
      return false;
    }
  }

  const sizeLimit = size_limit || DEFAULT_UPLOAD_SIZE_LIMIT_BYTES;
  if (file.size && file.size > sizeLimit) {
    addNotification(
      t('File is too large: {{ size }}, maximum upload size is {{ limit }}', {
        limit: prettifyFileSize(sizeLimit),
        size: prettifyFileSize(file.size),
      }),
      'error',
    );
    return false;
  }

  return true;
};

export function prettifyFileSize(bytes: number, precision = 3) {
  const units = ['B', 'kB', 'MB', 'GB'];
  const exponent = Math.min(
    Math.floor(Math.log(bytes) / Math.log(1024)),
    units.length - 1,
  );
  const mantissa = bytes / 1024 ** exponent;
  const formattedMantissa =
    precision === 0 ? Math.round(mantissa).toString() : mantissa.toPrecision(precision);
  return `${formattedMantissa} ${units[exponent]}`;
}
