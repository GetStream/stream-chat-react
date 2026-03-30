import { Chat, useCreateChatClient } from 'stream-chat-react';
import { apiKey, userId, userName, userToken } from './credentials';

const App = () => {
  const client = useCreateChatClient({
    apiKey,
    tokenOrProvider: userToken,
    userData: { id: userId, name: userName },
  });

  if (!client) return <div>Setting up client & connection...</div>;

  return <Chat client={client}>Chat with client is ready!</Chat>;
};

export default App;
