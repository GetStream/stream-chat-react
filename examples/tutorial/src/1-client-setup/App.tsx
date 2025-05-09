import { Chat, useCreateChatClient } from 'stream-chat-react';

// your Stream app information
const apiKey = 'REPLACE_WITH_API_KEY';
const userId = 'REPLACE_WITH_USER_ID';
const userName = 'REPLACE_WITH_USER_NAME';
const userToken = 'REPLACE_WITH_USER_TOKEN';

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
