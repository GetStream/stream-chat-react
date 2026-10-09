import type { Channel } from 'stream-chat';

const baseApiUrl = 'https://ai-sdk-server-0f347d455e2e.herokuapp.com';

export const startAiAgent = async (
  channel: Channel,
  model: string | File | null,
  platform:
    | 'openai'
    | 'anthropic'
    | 'gemini'
    | 'xai'
    | (string & {}) = 'openai',
) => {
  return await fetch(`${baseApiUrl}/start-ai-agent`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      channel_id: channel.id,
      channel_type: channel.type,
      platform,
      model,
    }),
  });
};

export const summarizeConversation = async (text: string): Promise<string> => {
  return fetch(`${baseApiUrl}/summarize`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text, platform: 'openai' }),
  })
    .then((res) => res.json())
    .then((json) => json.summary);
};
