import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useChatContext } from 'stream-chat-react';
import type { UserResponse } from 'stream-chat';
import _debounce from 'lodash/debounce';

import { UserType } from '../ChatContainer/ChatContainer';

import './NewChat.scss';

export const NewChat = () => {
  const { client } = useChatContext();

  const [focusedUser, setFocusedUser] = useState<number>();
  const [inputText, setInputText] = useState('');
  const [resultsOpen, setResultsOpen] = useState(false);
  const [searchEmpty, setSearchEmpty] = useState(false);
  const [searching, setSearching] = useState(false);
  const [selectedUsers, setSelectedUsers] = useState<UserResponse<UserType>[]>([]);
  const [users, setUsers] = useState<UserResponse<UserType>[]>([]);

  const inputRef = useRef<HTMLInputElement>(null);

  const findUsers = async () => {
    if (searching) return;
    setSearching(true);

    try {
      const response = await client.queryUsers(
        {
          id: { $ne: client.userID as string },
          $and: [
            { name: { $autocomplete: inputText } },
            // { name: { $nin: ['Daniel Smith', 'Kevin Rosen', 'Jen Alexander'] } },
          ],
        },
        { id: 1 },
        { limit: 6 },
      );

      if (!response.users.length) {
        setSearchEmpty(true);
      } else {
        setSearchEmpty(false);
        setUsers(response.users);
        console.log('response.users:', response.users);
      }

      setResultsOpen(true);
    } catch (error) {
      console.log({ error });
    }

    setSearching(false);
  };

  const findUsersDebounce = _debounce(findUsers, 100, {
    trailing: true,
  });

  useEffect(() => {
    if (inputText) {
      findUsersDebounce();
    }
  }, [inputText]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
  <div className='new-chat'>
      {/* <header> */}
    <div className='new-chat-input'>
      <div className='new-chat-input-to'>To: </div>
      <div className='new-chat-input-selected'>
        {/* {!!selectedUsers?.length && (
          <div className='messaging-create-channel__users'>
            {selectedUsers.map((user) => (
              <div
                className='messaging-create-channel__user'
                onClick={() => removeUser(user)}
                key={user.id}
              >
                <div className='messaging-create-channel__user-text'>{user.name}</div>
                <XButton />
              </div>
            ))}
          </div>
        )} */}
        <form>
          <input
            autoFocus
            ref={inputRef}
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder={!selectedUsers.length ? 'Type a name' : ''}
            type='text'
          />
        </form>
      </div>
    </div>
    <div>
        {users}
    </div>
  </div>
  );
};
