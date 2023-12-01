import { useCallback } from 'react';
import debounce from 'lodash.debounce';

import { SearchLocalUserParams, searchLocalUsers } from './utils';

import { UserItem } from '../../UserItem/UserItem';

import { useChatContext } from '../../../context/ChatContext';
import { useChannelStateContext } from '../../../context/ChannelStateContext';

import type { UserResponse } from 'stream-chat';

import type { SearchQueryParams } from '../../ChannelSearch/hooks/useChannelSearch';
import type { UserTriggerSetting } from '../../MessageInput/DefaultTriggerProvider';

import type { DefaultStreamChatGenerics } from '../../../types/types';

export type UserTriggerParams<
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics
> = {
  onSelectUser: (item: UserResponse<StreamChatGenerics>) => void;
  disableMentions?: boolean;
  mentionAllAppUsers?: boolean;
  mentionQueryParams?: SearchQueryParams<StreamChatGenerics>['userFilters'];
  useMentionsTransliteration?: boolean;
};

const DEBOUNCE_DELAY = 200;

export const useUserTrigger = <
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics
>(
  params: UserTriggerParams<StreamChatGenerics>,
): UserTriggerSetting<StreamChatGenerics> => {
  const {
    disableMentions,
    mentionAllAppUsers,
    mentionQueryParams = {},
    onSelectUser,
    useMentionsTransliteration,
  } = params;

  const { client, mutes, themeVersion } = useChatContext<StreamChatGenerics>('useUserTrigger');
  const { channel } = useChannelStateContext<StreamChatGenerics>('useUserTrigger');

  const { members } = channel.state;
  const { watchers } = channel.state;

  const getMembersAndWatchers = useCallback(() => {
    const memberUsers = members ? Object.values(members).map(({ user }) => user) : [];
    const watcherUsers = watchers ? Object.values(watchers) : [];
    const users = [...memberUsers, ...watcherUsers];

    // make sure we don't list users twice
    const uniqueUsers: Record<string, UserResponse<StreamChatGenerics>> = {};

    users.forEach((user) => {
      if (user && !uniqueUsers[user.id]) {
        uniqueUsers[user.id] = user;
      }
    });

    return Object.values(uniqueUsers);
  }, [members, watchers]);

  const queryMembersDebounced = useCallback(
    debounce(
      async (query: string, onReady: (users: UserResponse<StreamChatGenerics>[]) => void) => {
        try {
          // @ts-expect-error
          const response = await channel.queryMembers({
            name: { $autocomplete: query },
          });

          const users = response.members.map(
            (member) => member.user,
          ) as UserResponse<StreamChatGenerics>[];

          if (onReady && users.length) {
            onReady(users);
          } else {
            onReady([]);
          }
        } catch (error) {
          console.log({ error });
        }
      },
      DEBOUNCE_DELAY,
    ),
    [channel],
  );

  const queryUsersDebounced = useCallback(
    debounce(
      async (query: string, onReady: (users: UserResponse<StreamChatGenerics>[]) => void) => {
        if (!query) return;

        try {
          const { users } = await client.queryUsers(
            // @ts-expect-error
            {
              $or: [{ id: { $autocomplete: query } }, { name: { $autocomplete: query } }],
              id: { $ne: client.userID },
              ...(typeof mentionQueryParams.filters === 'function'
                ? mentionQueryParams.filters(query)
                : mentionQueryParams.filters),
            },
            Array.isArray(mentionQueryParams.sort)
              ? [{ id: 1 }, ...mentionQueryParams.sort]
              : { id: 1, ...mentionQueryParams.sort },
            // TODO: adjust limit
            { limit: 10, ...mentionQueryParams.options },
          );
          onReady?.(users);
        } catch (error) {
          console.log({ error });
        }
      },
      DEBOUNCE_DELAY,
    ),
    [client, mentionQueryParams],
  );

  const filterMutes = (data: UserResponse<StreamChatGenerics>[], text: string) => {
    if (text.includes('/unmute') && !mutes.length) {
      return [];
    }
    if (!mutes.length) return data;

    if (text.includes('/unmute')) {
      return data.filter((suggestion) => mutes.some((mute) => mute.target.id === suggestion.id));
    }
    return data.filter((suggestion) => mutes.every((mute) => mute.target.id !== suggestion.id));
  };

  return {
    callback: onSelectUser,
    component: UserItem,
    dataProvider: (query, text, onReady) => {
      if (disableMentions) return;

      if (mentionAllAppUsers) {
        return queryUsersDebounced(query, (data: UserResponse<StreamChatGenerics>[]) => {
          onReady?.(filterMutes(data, text), query);
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

        const params: SearchLocalUserParams<StreamChatGenerics> = {
          ownUserId: client.userID,
          query,
          text,
          useMentionsTransliteration,
          users,
        };

        const matchingUsers = searchLocalUsers<StreamChatGenerics>(params);

        const usersToShow = mentionQueryParams.options?.limit ?? (themeVersion === '2' ? 7 : 10);
        const data = matchingUsers.slice(0, usersToShow);

        return onReady?.(filterMutes(data, text), query);
      }

      queryMembersDebounced(query, (data: UserResponse<StreamChatGenerics>[]) => {
        onReady?.(filterMutes(data, text), query);
      });
    },
    output: (entity) => ({
      caretPosition: 'next',
      key: entity.id,
      text: `@${entity.name || entity.id}`,
    }),
  };
};
