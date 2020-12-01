import React, { useContext, useState, useRef, useEffect } from 'react';
import { Avatar, ChannelContext } from 'stream-chat-react';

import { XButton } from '../../assets';

import './CreateChannel.css';

const CreateChannel = ({ onClose, visible }) => {
  const { client } = useContext(ChannelContext);
  const [users, setUsers] = useState();
  const [searching, setSearching] = useState(false);
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [inputText, setInputText] = useState('');
  const inputRef = useRef();

  useEffect(() => {
    const findUsers = async () => {
      if (!searching) {
        setSearching(true);
        try {
          const response = await client.queryUsers({
            name: { $autocomplete: inputText },
          });
          setUsers(response.users);
        } catch (error) {
          console.log({ error });
        }
        setSearching(false);
      }
    };
    if (inputText) {
      findUsers();
    }
  }, [client, inputText, searching]);

  const newChannel = async () => {
    const selectedUsersIds = selectedUsers.map((u) => u.id);

    const conversation = await client.channel('messaging', {
      members: [...selectedUsersIds, 'example-user'],
    });
    await conversation.watch();
    setSelectedUsers([]);
    setUsers();
    onClose();
  };

  const addUser = (u) => {
    setSelectedUsers([...selectedUsers, u]);
    setInputText('');
    inputRef.current.focus();
  };

  const removeUser = (user) => {
    const newUsers = selectedUsers.filter((item) => item.id !== user.id);
    setSelectedUsers(newUsers);
    inputRef.current.focus();
  };

  // const onSearch = (e) => {
  //   e.preventDefault();
  //   findUsers(e);
  // };

  // const handleKeyDown = useCallback((e) => {
  //   // check for up(38) or down(40) key
  //   if (e.which === 38) {
  //     console.log('1 user up');
  //   }
  //   if (e.which === 40) {
  //     console.log('1 user down');
  //   }
  //   if (e.which === 13) {
  //     console.log('submit selected user');
  //     addUser();
  //   }
  // }, []);

  // useEffect(() => {
  //   document.addEventListener('keydown', handleKeyDown, false);
  //   return () => document.removeEventListener('keydown', handleKeyDown);
  // }, [handleKeyDown]);

  if (!visible) return null;

  return (
    <div className="messaging-create-channel">
      <header>
        <div className="messaging-create-channel__left">
          <div className="messaging-create-channel__left-text">To: </div>
          {!!selectedUsers?.length && (
            <div className="messaging-create-channel__users">
              {selectedUsers.map((user) => (
                <div
                  className="messaging-create-channel__user"
                  onClick={() => removeUser(user)}
                  key={user.id}
                >
                  <div className="messaging-create-channel__user-text">
                    {user.name}
                  </div>
                  <XButton />
                </div>
              ))}
            </div>
          )}
          <form onSubmit={addUser}>
            <input
              autoFocus
              ref={inputRef}
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              type="text"
              className="messaging-create-channel__input"
            />
          </form>
        </div>
        <button className="create-channel-button" onClick={newChannel}>
          Start chat
        </button>
      </header>
      <main>
        <ul className="messaging-create-channel__user-results">
          {!!users?.length && (
            <div>
              {users.slice(0, 6).map((user) => (
                <div
                  className="messaging-create-channel__user-result"
                  onClick={() => addUser(user)}
                  key={user.id}
                >
                  <UserResult user={user} />
                </div>
              ))}
            </div>
          )}
        </ul>
      </main>
    </div>
  );
};

const UserResult = ({ user }) => {
  return (
    <li className="messaging-create-channel__user-result">
      <div className="messaging-create-channel__user-result__avatar">
        <Avatar />
      </div>
      <div className="messaging-create-channel__user-result__details">
        <span>{user.name}</span>
        <span className="messaging-create-channel__user-result__details__last-seen">
          {user.online}
        </span>
      </div>
    </li>
  );
};

export default React.memo(CreateChannel);
