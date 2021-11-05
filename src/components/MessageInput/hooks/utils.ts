import type { ImageUpload } from 'react-file-utils';
import type { FileUploadConfig, UserResponse } from 'stream-chat';

import type { ChannelActionContextValue } from '../../../context/ChannelActionContext';
import type { ChatContextValue } from '../../../context/ChatContext';
import type { TranslationContextValue } from '../../../context/TranslationContext';
import type {
  DefaultAttachmentType,
  DefaultChannelType,
  DefaultCommandType,
  DefaultEventType,
  DefaultMessageType,
  DefaultReactionType,
  DefaultUserType,
} from '../../../types/types';

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

export type SearchLocalUserParams<Us extends DefaultUserType<Us> = DefaultUserType> = {
  ownUserId: string | undefined;
  query: string;
  text: string;
  users: UserResponse<Us>[];
  useMentionsTransliteration?: boolean;
};

export const searchLocalUsers = <Us extends DefaultUserType<Us> = DefaultUserType>(
  params: SearchLocalUserParams<Us>,
): UserResponse<Us>[] => {
  const { ownUserId, query, text, useMentionsTransliteration, users } = params;

  const matchingUsers = users.filter((user) => {
    if (user.id === ownUserId) return false;
    if (!query) return true;

    let updatedId = removeDiacritics(user.id).toLowerCase();
    let updatedName = removeDiacritics(user.name).toLowerCase();
    let updatedQuery = removeDiacritics(query).toLowerCase();

    if (useMentionsTransliteration) {
      (async () => {
        const { default: transliterate } = await import('@sindresorhus/transliterate');
        updatedName = transliterate(user.name || '').toLowerCase();
        updatedQuery = transliterate(query).toLowerCase();
        updatedId = transliterate(user.id).toLowerCase();
      })();
    }

    const maxDistance = 3;
    const lastDigits = text.slice(-(maxDistance + 1)).includes('@');

    if (updatedName) {
      const levenshtein = calculateLevenshtein(updatedQuery, updatedName);
      if (updatedName.includes(updatedQuery) || (levenshtein <= maxDistance && lastDigits)) {
        return true;
      }
    }

    const levenshtein = calculateLevenshtein(updatedQuery, updatedId);

    return updatedId.includes(updatedQuery) || (levenshtein <= maxDistance && lastDigits);
  });

  return matchingUsers;
};

type CheckUploadPermissionsParams<
  At extends DefaultAttachmentType = DefaultAttachmentType,
  Ch extends DefaultChannelType = DefaultChannelType,
  Co extends DefaultCommandType = DefaultCommandType,
  Ev extends DefaultEventType = DefaultEventType,
  Me extends DefaultMessageType = DefaultMessageType,
  Re extends DefaultReactionType = DefaultReactionType,
  Us extends DefaultUserType<Us> = DefaultUserType
> = {
  addNotification: ChannelActionContextValue<At, Ch, Co, Ev, Me, Re, Us>['addNotification'];
  appSettings: ChatContextValue<At, Ch, Co, Ev, Me, Re, Us>['appSettings'];
  file: ImageUpload['file'];
  t: TranslationContextValue['t'];
  uploadType: 'image' | 'file';
};

export const checkUploadPermissions = <
  At extends DefaultAttachmentType = DefaultAttachmentType,
  Ch extends DefaultChannelType = DefaultChannelType,
  Co extends DefaultCommandType = DefaultCommandType,
  Ev extends DefaultEventType = DefaultEventType,
  Me extends DefaultMessageType = DefaultMessageType,
  Re extends DefaultReactionType = DefaultReactionType,
  Us extends DefaultUserType<Us> = DefaultUserType
>(
  params: CheckUploadPermissionsParams<At, Ch, Co, Ev, Me, Re, Us>,
) => {
  const { addNotification, appSettings, file, t, uploadType } = params;

  const {
    allowed_file_extensions,
    allowed_mime_types,
    blocked_file_extensions,
    blocked_mime_types,
  } =
    ((uploadType === 'image'
      ? appSettings?.app?.image_upload_config
      : appSettings?.app?.file_upload_config) as FileUploadConfig) || {};

  const sendErrorNotification = () =>
    addNotification(
      t(`Upload type: "{{ type }}" is not allowed`, { type: file.type || 'unknown type' }),
      'error',
    );

  if (allowed_file_extensions?.length) {
    const allowed = allowed_file_extensions.some((ext) =>
      file.name.toLowerCase().endsWith(ext.toLowerCase()),
    );

    if (!allowed) {
      sendErrorNotification();
      return false;
    }
  }

  if (blocked_file_extensions?.length) {
    const blocked = blocked_file_extensions.some((ext) =>
      file.name.toLowerCase().endsWith(ext.toLowerCase()),
    );

    if (blocked) {
      sendErrorNotification();
      return false;
    }
  }

  if (allowed_mime_types?.length) {
    const allowed = allowed_mime_types.some(
      (type) => type.toLowerCase() === file.type?.toLowerCase(),
    );

    if (!allowed) {
      sendErrorNotification();
      return false;
    }
  }

  if (blocked_mime_types?.length) {
    const blocked = blocked_mime_types.some(
      (type) => type.toLowerCase() === file.type?.toLowerCase(),
    );

    if (blocked) {
      sendErrorNotification();
      return false;
    }
  }

  return true;
};
