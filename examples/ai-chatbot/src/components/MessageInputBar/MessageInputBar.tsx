import { AIMessageComposer } from '@stream-io/chat-react-ai';
import {
  useChannelActionContext,
  useChannelStateContext,
  useMessageComposer,
} from 'stream-chat-react';
import { startAiAgent } from '../../api.ts';
import './MessageInputBar.scss';

export const MessageInputBar = () => {
  const { updateMessage, sendMessage } = useChannelActionContext();
  const { channel } = useChannelStateContext();
  const composer = useMessageComposer();

  return (
    <div className="ai-demo-message-input-bar">
      <AIMessageComposer
        onSubmit={async (e) => {
          const event = e;
          const target = (event.currentTarget ??
            event.target) as HTMLFormElement | null;
          event.preventDefault();

          const formData = new FormData(event.currentTarget);

          const t = formData.get('message');
          const model = formData.get('model');

          composer.textComposer.setText(t as string);

          const d = await composer.compose();

          if (!d) return;

          target?.reset();
          composer.clear();

          if (channel.initialized) {
            const isAiAgentActive = Object.keys(channel.state.watchers).some(
              (userId) => userId.startsWith('ai-bot'),
            );
            if (!isAiAgentActive) {
              await startAiAgent(channel, model);
            }

            await sendMessage(d);
          } else {
            updateMessage(d?.localMessage);

            await channel.watch();

            // TODO: wrap in retry (in case channel creation takes longer)
            await startAiAgent(channel, model);

            await sendMessage(d);
          }
        }}
      />
    </div>
  );
};
