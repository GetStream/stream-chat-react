import { useCallback, useState } from 'react';
import throttle from 'lodash.throttle';

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

  const [searching, setSearching] = useState(false);

  const { client, mutes, themeVersion } = useChatContext<StreamChatGenerics>('useUserTrigger');
  const { channel } = useChannelStateContext<StreamChatGenerics>('useUserTrigger');

  const { members } = channel.state;
  const { watchers } = channel.state;

  const getMembersAndWatchers = useCallback(() => {
    const memberUsers = members ? Object.values(members).map(({ user }) => user) : [];
    const watcherUsers = watchers ? Object.values(watchers) : [];
    const users = [...memberUsers, ...watcherUsers];

    // make sure we don't list users twice
    const uniqueUsers = {} as Record<string, UserResponse<StreamChatGenerics>>;

    users.forEach((user) => {
      if (user && !uniqueUsers[user.id]) {
        uniqueUsers[user.id] = user;
      }
    });

    return Object.values(uniqueUsers);
  }, [members, watchers]);

  const queryMembersThrottled = useCallback(
    throttle(
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
      200,
    ),
    [channel],
  );

  const queryUsers = async (
    query: string,
    onReady: (users: UserResponse<StreamChatGenerics>[]) => void,
  ) => {
    if (!query || searching) return;
    setSearching(true);

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
    callback: (item) => onSelectUser(item),
    component: UserItem,
    dataProvider: (query, text, onReady) => {
      if (disableMentions) return;

      const filterMutes = (data: UserResponse<StreamChatGenerics>[]) => {
        if (text.includes('/unmute') && !mutes.length) {
          return [];
        }
        if (!mutes.length) return data;

        if (text.includes('/unmute')) {
          return data.filter((suggestion) =>
            mutes.some((mute) => mute.target.id === suggestion.id),
          );
        }
        return data.filter((suggestion) => mutes.every((mute) => mute.target.id !== suggestion.id));
      };

      if (mentionAllAppUsers) {
        return queryUsersThrottled(query, (data: UserResponse<StreamChatGenerics>[]) => {
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

        if (onReady) onReady(filterMutes(data), query);
        return data;
      }

      return queryMembersThrottled(query, (data: UserResponse<StreamChatGenerics>[]) => {
        if (onReady) onReady(filterMutes(data), query);
      });
    },
    output: (entity) => ({
      caretPosition: 'next',
      key: entity.id,
      text: `@${entity.name || entity.id}`,
    }),
  };
};
