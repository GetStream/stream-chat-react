// entry file for Rollup for the UMD build \w Emojis
export * from './components';
export * from './context';
export * from './i18n';
// todo: distribute utils into separate files
export * from './utils';
export { getChannel } from './utils/getChannel';
export * from './components/Emojis';

declare global {
  interface Window {
    Channel: typeof import('stream-chat').Channel;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ICAL: any;
    logChatPromiseExecution: typeof import('stream-chat').logChatPromiseExecution;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    StreamChat: typeof import('stream-chat') & { StreamChat: any };
  }
}

window.StreamChat.StreamChat = window.StreamChat;
window.StreamChat.logChatPromiseExecution = window.logChatPromiseExecution;
window.StreamChat.Channel = window.Channel;
window.ICAL = window.ICAL || {};
