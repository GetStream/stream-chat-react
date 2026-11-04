import { Chat, useCreateChatClient } from 'stream-chat-react';
import { AssistantWidget } from './AssistantWidget';
import { isMessageAIGenerated } from './isMessageAIGenerated';

const apiKey = 'YOUR_API_KEY';
const userId = 'YOUR_USER_ID';
const userToken = 'YOUR_USER_TOKEN';
// The user's channel with the assistant, which your backend creates.
const assistantChannelId = 'YOUR_ASSISTANT_CHANNEL_ID';

/**
 * An app that has no chat of its own, only the widget. Load the SDK's stylesheet in a CSS layer, as
 * the base app's `chat.css` does, so the widget's CSS wins over it.
 */
export const App = () => {
  const client = useCreateChatClient({
    apiKey,
    tokenOrProvider: userToken,
    userData: { id: userId },
  });

  return (
    <>
      <main>{/* Your app's own pages. */}</main>
      {client && (
        <Chat client={client} isMessageAIGenerated={isMessageAIGenerated}>
          {/* The SDK's tokens are set on `.str-chat`; without ChatView, the widget needs one. */}
          <div className='str-chat'>
            <AssistantWidget channelId={assistantChannelId} />
          </div>
        </Chat>
      )}
    </>
  );
};
