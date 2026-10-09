import type { Channel } from 'stream-chat';

const baseApiUrl =
  process.env.NEXT_PUBLIC_AI_SERVER_URL ??
  'https://ai-sdk-server-0f347d455e2e.herokuapp.com';

export const startAiAgent = async (
  channel: Channel,
  model: string | File | null,
  platform: 'openai' | 'anthropic' | 'gemini' | 'xai' | (string & {}) = 'openai',
) =>
  await fetch(`${baseApiUrl}/start-ai-agent`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      channel_id: channel.id,
      channel_type: channel.type,
      platform,
      model,
    }),
  });

export const summarizeConversation = (text: string): Promise<string> =>
  fetch(`${baseApiUrl}/summarize`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text, platform: 'openai' }),
  })
    .then((res) => res.json())
    .then((json) => json.summary);
