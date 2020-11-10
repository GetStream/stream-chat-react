import React, { useContext, useEffect, useState } from 'react';
import { Avatar, ChatContext } from 'stream-chat-react';

import './UserList.css';

import { InviteIcon } from '../../assets/InviteIcon';

const UserItem = ({ index, setSelectedUsers, user }) => {
  const [selected, setSelected] = useState(false);

  const getLastActive = (i) => {
    switch (i) {
      case 0:
        return '12 min ago';
      case 1:
        return '27 min ago';
      case 2:
        return '6 hours ago';
      case 3:
        return '14 hours ago';
      case 4:
        return 'Yesterday';
      default:
        return 'Yesterday';
    }
  };

  const handleClick = () => {
    if (selected) {
      setSelectedUsers((prevUsers) =>
        prevUsers.filter((prevUser) => prevUser !== user.id),
      );
    } else {
      setSelectedUsers((prevUsers) => [...prevUsers, user.id]);
    }
    setSelected(!selected);
  };

  return (
    <div className="user-item__wrapper" onClick={handleClick}>
      <div className="user-item__name-wrapper">
        <Avatar image={user.image} size={32} />
        <p className="user-item__name">{user.name}</p>
      </div>
      <p className="user-item__last-active">{getLastActive(index)}</p>
      {selected ? <InviteIcon /> : <div className="user-item__invite-empty" />}
    </div>
  );
};

export const UserList = ({ setSelectedUsers }) => {
  const { client } = useContext(ChatContext);

  const [loading, setLoading] = useState(false);
  const [users, setUsers] = useState([]);

  useEffect(() => {
    const getUsers = async () => {
      setLoading(true);
      const response = await client.queryUsers(
        {},
        { last_active: -1, role: -1 },
        { limit: 6 },
      );

      if (response.users.length) setUsers(response.users);
      setLoading(false);
    };

    if (client) getUsers();
  }, [client]);

  return (
    <div className="user-list__container">
      <div className="user-list__header">
        <p>User</p>
        <p>Last Active</p>
        <p>Invite</p>
      </div>
      {loading ? (
        <div className="user-list__loading">Loading users...</div>
      ) : (
        users.length &&
        users.map((user, i) => (
          <UserItem
            index={i}
            key={user.id}
            setSelectedUsers={setSelectedUsers}
            user={user}
          />
        ))
      )}
    </div>
  );
};
