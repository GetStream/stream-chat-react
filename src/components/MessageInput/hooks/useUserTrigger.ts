import { useCallback, useState } from 'react';
import throttle from 'lodash.throttle';

import type { SearchLocalUserParams } from './utils';
import { searchLocalUsers } from './utils';

import { UserItem } from '../../UserItem/UserItem';

import { useChatContext } from '../../../context/ChatContext';
import { useChannelStateContext } from '../../../context/ChannelStateContext';

import type { UserResponse } from 'stream-chat';

import type { SearchQueryParams } from '../../ChannelSearch/hooks/useChannelSearch';

export type UserTriggerParams = {
  onSelectUser: (item: UserResponse) => void;
  disableMentions?: boolean;
  mentionAllAppUsers?: boolean;
  mentionQueryParams?: SearchQueryParams['userFilters'];
  useMentionsTransliteration?: boolean;
};

export const useUserTrigger = (params: UserTriggerParams) => {
  const {
    disableMentions,
    mentionAllAppUsers,
    mentionQueryParams = {},
    onSelectUser,
    useMentionsTransliteration,
  } = params;

  const [searching, setSearching] = useState(false);

  const { client, mutes } = useChatContext('useUserTrigger');
  const { channel } = useChannelStateContext('useUserTrigger');

  const { members } = channel.state;
  const { watchers } = channel.state;

  const getMembersAndWatchers = useCallback(() => {
    const memberUsers = members ? Object.values(members).map(({ user }) => user) : [];
    const watcherUsers = watchers ? Object.values(watchers) : [];
    const users = [...memberUsers, ...watcherUsers];

    // make sure we don't list users twice
    const uniqueUsers = {} as Record<string, UserResponse>;

    users.forEach((user) => {
      if (user && !uniqueUsers[user.id]) {
        uniqueUsers[user.id] = user;
      }
    });

    return Object.values(uniqueUsers);
  }, [members, watchers]);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const queryMembersThrottled = useCallback(
    throttle(async (query: string, onReady: (users: UserResponse[]) => void) => {
      try {
        const response = await channel.queryMembers({
          name: { $autocomplete: query },
        });

        const users = response.members.map((member) => member.user) as UserResponse[];

        if (onReady && users.length) {
          onReady(users);
        } else {
          onReady([]);
        }
      } catch (error) {
        console.log({ error });
      }
    }, 200),
    [channel],
  );

  const queryUsers = async (query: string, onReady: (users: UserResponse[]) => void) => {
    if (!query || searching) return;
    setSearching(true);

    try {
      const { users } = await client.queryUsers(
        {
          $or: [{ id: { $autocomplete: query } }, { name: { $autocomplete: query } }],
          ...(typeof mentionQueryParams.filters === 'function'
            ? mentionQueryParams.filters(query)
            : mentionQueryParams.filters),
        },
        Array.isArray(mentionQueryParams.sort)
          ? [{ id: 1 }, ...mentionQueryParams.sort]
          : { id: 1, ...mentionQueryParams.sort },
        { limit: 10, ...mentionQueryParams.options },
      );

      if (onReady && users.length) {
        onReady(users);
      } else {
        onReady([]);
      }
    } catch (error) {
      console.log({ error });
    }

    setSearching(false);
  };

  const queryUsersThrottled = throttle(queryUsers, 200);

  return {
    callback: onSelectUser,
    component: UserItem,
    // @ts-expect-error tmp
    dataProvider: (query, text, onReady) => {
      if (disableMentions) return;

      const filterMutes = (data: UserResponse[]) => {
        if (text.includes('/unmute') && !mutes.length) {
          return [];
        }
        if (!mutes.length) return data;

        if (text.includes('/unmute')) {
          return data.filter((suggestion) =>
            mutes.some((mute) => mute.target.id === suggestion.id),
          );
        }
        return data.filter((suggestion) =>
          mutes.every((mute) => mute.target.id !== suggestion.id),
        );
      };

      if (mentionAllAppUsers) {
        return queryUsersThrottled(query, (data: UserResponse[]) => {
          if (onReady) onReady(filterMutes(data), query);
        });
      }

      /**
       * By default, we return maximum 100 members via queryChannels api call.
       * Thus it is safe to assume, that if number of members in channel.state is < 100,
       * then all the members are already available on client side and we don't need to
       * make any api call to queryMembers endpoint.
       */
      if (!query || Object.values(members || {}).length < 100) {
        const users = getMembersAndWatchers();

        const params: SearchLocalUserParams = {
          ownUserId: client.userID,
          query,
          text,
          useMentionsTransliteration,
          users,
        };

        const matchingUsers = searchLocalUsers(params);

        const usersToShow = mentionQueryParams.options?.limit ?? 7;
        const data = matchingUsers.slice(0, usersToShow);

        if (onReady) onReady(filterMutes(data), query);
        return data;
      }

      return queryMembersThrottled(query, (data: UserResponse[]) => {
        if (onReady) onReady(filterMutes(data), query);
      });
    },
    // @ts-expect-error tmp
    output: (entity) => ({
      caretPosition: 'next',
      key: entity.id,
      text: `@${entity.name || entity.id}`,
    }),
  };
};
