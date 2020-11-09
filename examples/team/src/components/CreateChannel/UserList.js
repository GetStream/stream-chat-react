import React, { useContext, useEffect, useState } from 'react';
import { ChatContext } from 'stream-chat-react';

import './UserList.css';

const UserItem = ({ user }) => {
  return (
    <div className="user-item__wrapper">
      <p>{user.name}</p>
    </div>
  );
};

export const UserList = () => {
  const { client } = useContext(ChatContext);

  const [loading, setLoading] = useState(false);
  const [users, setUsers] = useState([]);

  useEffect(() => {
    const getUsers = async () => {
      setLoading(true);
      const response = await client.queryUsers(
        {},
        { last_active: -1 },
        { limit: 5 },
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
        users.map((user) => {
          console.log(user);
          return <UserItem key={user.id} user={user} />;
        })
      )}
    </div>
  );
};
