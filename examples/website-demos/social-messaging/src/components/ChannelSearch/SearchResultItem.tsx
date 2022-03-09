import Dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import {
  Avatar,
  getDisplayTitle,
  getLatestMessagePreview,
  isChannel,
  SearchResultItemProps,
  useChatContext,
  useTranslationContext,
} from 'stream-chat-react';

import { AvatarGroup, getTimeStamp } from '../ChannelPreview/utils';
import { StreamChatGenerics } from '../../types';

import './SocialChannelSearch.scss';

export const SearchResultItem = (props: SearchResultItemProps<StreamChatGenerics>) => {
  const { index, result, selectResult } = props;

  const { client } = useChatContext();
  const { t, userLanguage } = useTranslationContext();

  if (isChannel(result)) {
    const channel = result;
    const displayTitle = getDisplayTitle(channel, client.user);
    const latestMessage = getLatestMessagePreview(channel, t, userLanguage);
    const members = Object.values(channel.state.members).filter(
      ({ user }) => user?.id !== client.userID,
    );
    const online = !!channel.state.watcher_count ? true : false;
    const unread = channel.countUnread();
    const unreadCount = !!unread ? true : false;

    return (
      <button
        className='search-result'
        key={index}
        onClick={() => {
          selectResult(channel);
          // handleUnreadCounts();
        }}
      >
        <div className='search-result-avatar'>
          {online && <div className='search-result-avatar-online'></div>}
          <AvatarGroup members={members} size={56} />
        </div>
        <div className='search-result-contents'>
          <div className='search-result-contents-name'>
            <span>{displayTitle}</span>
          </div>
          <div className='search-result-contents-last-message'>{latestMessage}</div>
        </div>
        <div className='search-result-end'>
          <div className={`search-result-end-unread ${unreadCount ? '' : 'unreadCount'}`}>
            <span className='search-result-end-unread-text'>{unread}</span>
          </div>
          <div className='search-result-end-statuses'>
            {/* <div className='search-result-end-statuses-arrows'>
              {members.length === 2 && <DoubleCheckmark />}
            </div> */}
            <p className='search-result-end-statuses-timestamp'>{getTimeStamp(channel)}</p>
          </div>
        </div>
      </button>
    );
  } else {
    Dayjs.extend(relativeTime);
    const status = Dayjs().from(Dayjs(result.last_active), true);

    return (
      <div
        className='search-result-user'
        key={index}
        onClick={() => {
          selectResult(result);
        }}
      >
        <Avatar image={result?.image || ''} name={result?.name || result?.id} size={56} />
        <div className='search-result-user-contents'>
          <div className='search-result-user-contents-name'>
            <span>{result?.name || result?.id}</span>
          </div>
          <div className='search-result-user-contents-status'>
            {result.last_active ? <span>Last online {status} ago</span> : <span>Not online</span>}
          </div>
        </div>
      </div>
    );
  }
};
