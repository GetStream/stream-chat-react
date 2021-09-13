import type { UserResponse } from 'stream-chat';

import type { DefaultUserType } from '../../../types/types';

export const accentsMap: { [key: string]: string } = {
  a: 'á|à|ã|â|À|Á|Ã|Â',
  c: 'ç|Ç',
  e: 'é|è|ê|É|È|Ê',
  i: 'í|ì|î|Í|Ì|Î',
  n: 'ñ|Ñ',
  o: 'ó|ò|ô|õ|Ó|Ò|Ô|Õ',
  u: 'ú|ù|û|ü|Ú|Ù|Û|Ü',
};

export const removeDiacritics = (text?: string) => {
  if (!text) return '';
  return Object.keys(accentsMap).reduce(
    (acc, current) => acc.replace(new RegExp(accentsMap[current], 'g'), current),
    text,
  );
};

export const calculateLevenshtein = (query: string, target: string) => {
  if (query.length === 0) return target.length;
  if (target.length === 0) return query.length;

  if (query.length > target.length) {
    const tmp = query;
    query = target;
    target = tmp;
  }

  const row = [];
  for (let i = 0; i <= query.length; i++) {
    row[i] = i;
  }

  for (let i = 1; i <= query.length; i++) {
    let prev = i;
    for (let j = 1; j <= query.length; j++) {
      let val;
      if (target.charAt(i - 1) === query.charAt(j - 1)) {
        val = row[j - 1]; // match
      } else {
        val = Math.min(
          row[j - 1] + 1, // substitution
          prev + 1, // insertion
          row[j] + 1,
        ); // deletion
      }
      row[j - 1] = prev;
      prev = val;
    }
    row[query.length] = prev;
  }

  return row[query.length];
};

export const searchLocalUsers = <Us extends DefaultUserType<Us> = DefaultUserType>(
  ownUserId: string | undefined,
  users: UserResponse<Us>[],
  query: string,
): UserResponse<Us>[] => {
  const matchingUsers = users.filter((user) => {
    if (user.id === ownUserId) return false;
    if (!query) return true;

    const updatedName = removeDiacritics(user.name).toLowerCase();
    const updatedQuery = removeDiacritics(query).toLowerCase();

    if (updatedName !== undefined) {
      const levenshtein = calculateLevenshtein(updatedQuery, updatedName);

      if (updatedName.includes(updatedQuery) || levenshtein <= 3) return true;
    }

    const updatedId = removeDiacritics(user.id).toLowerCase();

    return updatedId.toLowerCase().includes(updatedQuery);
  });

  return matchingUsers;
};
