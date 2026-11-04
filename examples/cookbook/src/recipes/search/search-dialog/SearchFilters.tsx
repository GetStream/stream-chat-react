import { useMemo, useState } from 'react';
import type { SearchSource, SortParamRequest } from 'stream-chat';
import { useChatContext, useStateStore } from 'stream-chat-react';
import {
  channelSorts,
  getDialogSources,
  messageSorts,
  searchAgain,
  userSorts,
} from './searchController';
import type { MessageFilterContext } from './searchController';
import './SearchFilters.css';

type Generators = Record<string, { enabled: boolean }>;

const enabledSelector = (config: Generators) => ({
  groupsOnly: !!config.groupsOnly?.enabled,
  hideArchived: !!config.hideArchived?.enabled,
  withAttachments: !!config.withAttachments?.enabled,
});

const messageContextSelector = ({
  authorId,
  sentFrom,
  sentTo,
}: MessageFilterContext) => ({
  authorId,
  sentFrom,
  sentTo,
});

/** The key of the sort a source uses, from one of the sort maps. */
const sortKeyOf = <K extends string>(
  sorts: Record<K, SortParamRequest[]>,
  sort: SortParamRequest[] | undefined,
) => (Object.keys(sorts) as K[]).find((key) => sorts[key] === sort);

/** Everyone in the user's loaded channels, for the "From" select. */
const usePeople = () => {
  const { channelManager, client } = useChatContext();
  return useMemo(() => {
    const people = new Map<string, string>();
    for (const channel of channelManager.values()) {
      for (const member of Object.values(channel.state.members)) {
        if (member.user && member.user.id !== client.userId) {
          people.set(member.user.id, member.user.name ?? member.user.id);
        }
      }
    }
    return [...people].sort(([, a], [, b]) => a.localeCompare(b));
  }, [channelManager, client]);
};

export const SearchFilters = ({ id }: { id: string }) => {
  const { client, searchController } = useChatContext();
  const { channels, messages, users } = getDialogSources(searchController);
  const people = usePeople();

  const channelFilters = useStateStore(
    channels?.filterBuilder.filterConfig,
    enabledSelector,
  );
  const messageFilters = useStateStore(
    messages?.messageSearchFilterBuilder.filterConfig,
    enabledSelector,
  );
  const messageContext = useStateStore(
    messages?.messageSearchFilterBuilder.context,
    messageContextSelector,
  );

  // A source's sort isn't in a store, so the selects keep their own copy, read from the source.
  const [channelSort, setChannelSort] = useState<string>(
    () => sortKeyOf(channelSorts, channels?.sort) ?? 'activity',
  );
  const [userSort, setUserSort] = useState<string>(
    () => sortKeyOf(userSorts, users?.sort) ?? 'name',
  );
  const [messageSort, setMessageSort] = useState<string>(
    () => sortKeyOf(messageSorts, messages?.messageSearchSort) ?? 'newest',
  );

  // Every change applies from the next query, so search again from the first page.
  const change = (source: SearchSource, apply: () => void) => {
    apply();
    searchAgain(searchController, source);
  };

  return (
    <div className='cookbook-search-filters' id={id}>
      {channels && (
        <fieldset className='cookbook-search-filters__group'>
          <legend className='cookbook-search-filters__legend'>Channels</legend>
          <div className='cookbook-search-filters__controls'>
            <label className='cookbook-search-filters__field'>
              Sort by
              <select
                className='cookbook-search-filters__select'
                onChange={(event) => {
                  const key = event.target.value as keyof typeof channelSorts;
                  setChannelSort(event.target.value);
                  change(channels, () => {
                    channels.sort = channelSorts[key];
                  });
                }}
                value={channelSort}
              >
                <option value='activity'>Recent activity</option>
                <option value='newest'>Newest</option>
                <option value='members'>Most members</option>
              </select>
            </label>
            <label className='cookbook-search-filters__check'>
              <input
                checked={!channelFilters?.hideArchived}
                onChange={(event) =>
                  change(channels, () =>
                    event.target.checked
                      ? channels.filterBuilder.disableFilter('hideArchived')
                      : channels.filterBuilder.enableFilter('hideArchived'),
                  )
                }
                type='checkbox'
              />
              Include archived
            </label>
            <label className='cookbook-search-filters__check'>
              <input
                checked={!!channelFilters?.groupsOnly}
                onChange={(event) =>
                  change(channels, () =>
                    event.target.checked
                      ? channels.filterBuilder.enableFilter('groupsOnly')
                      : channels.filterBuilder.disableFilter('groupsOnly'),
                  )
                }
                type='checkbox'
              />
              Groups only
            </label>
          </div>
        </fieldset>
      )}

      {users && (
        <fieldset className='cookbook-search-filters__group'>
          <legend className='cookbook-search-filters__legend'>People</legend>
          <div className='cookbook-search-filters__controls'>
            <label className='cookbook-search-filters__field'>
              Sort by
              <select
                className='cookbook-search-filters__select'
                onChange={(event) => {
                  const key = event.target.value as keyof typeof userSorts;
                  setUserSort(event.target.value);
                  change(users, () => {
                    users.sort = userSorts[key];
                  });
                }}
                value={userSort}
              >
                <option value='name'>Name</option>
                <option value='active'>Recently active</option>
              </select>
            </label>
          </div>
        </fieldset>
      )}

      {messages && (
        <fieldset className='cookbook-search-filters__group'>
          <legend className='cookbook-search-filters__legend'>Messages</legend>
          <div className='cookbook-search-filters__controls'>
            <label className='cookbook-search-filters__field'>
              Order
              <select
                className='cookbook-search-filters__select'
                onChange={(event) => {
                  const key = event.target.value as keyof typeof messageSorts;
                  setMessageSort(event.target.value);
                  change(messages, () => {
                    messages.messageSearchSort = messageSorts[key];
                  });
                }}
                value={messageSort}
              >
                <option value='newest'>Newest first</option>
                <option value='oldest'>Oldest first</option>
              </select>
            </label>
            <label className='cookbook-search-filters__field'>
              From
              <select
                className='cookbook-search-filters__select'
                onChange={(event) =>
                  change(messages, () =>
                    messages.messageSearchFilterBuilder.updateContext({
                      authorId: event.target.value || undefined,
                    }),
                  )
                }
                value={messageContext?.authorId ?? ''}
              >
                <option value=''>Anyone</option>
                <option value={client.userId}>You</option>
                {people.map(([userId, name]) => (
                  <option key={userId} value={userId}>
                    {name}
                  </option>
                ))}
              </select>
            </label>
            <label className='cookbook-search-filters__field'>
              Sent from
              <input
                className='cookbook-search-filters__date'
                onChange={(event) =>
                  change(messages, () =>
                    messages.messageSearchFilterBuilder.updateContext({
                      sentFrom: event.target.value || undefined,
                    }),
                  )
                }
                type='date'
                value={messageContext?.sentFrom ?? ''}
              />
            </label>
            <label className='cookbook-search-filters__field'>
              Sent until
              <input
                className='cookbook-search-filters__date'
                onChange={(event) =>
                  change(messages, () =>
                    messages.messageSearchFilterBuilder.updateContext({
                      sentTo: event.target.value || undefined,
                    }),
                  )
                }
                type='date'
                value={messageContext?.sentTo ?? ''}
              />
            </label>
            <label className='cookbook-search-filters__check'>
              <input
                checked={!!messageFilters?.withAttachments}
                onChange={(event) =>
                  change(messages, () =>
                    event.target.checked
                      ? messages.messageSearchFilterBuilder.enableFilter(
                          'withAttachments',
                        )
                      : messages.messageSearchFilterBuilder.disableFilter(
                          'withAttachments',
                        ),
                  )
                }
                type='checkbox'
              />
              With attachments
            </label>
          </div>
        </fieldset>
      )}
    </div>
  );
};
