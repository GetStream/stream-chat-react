import type { StreamChat } from 'stream-chat';

// Validation only (`?leak=`): deliberate leaks that M-MEM must catch (roadmap step 15). Never on in a
// measured run; the settings log says when one is.
//
//   messages  every published message list is kept in a global array: the heap grows with every
//             page loaded and never comes back down
//   detached  every message-list element ever mounted is kept: leaving a channel leaves its whole
//             list detached but reachable

declare global {
  interface Window {
    __perfLeak?: unknown[];
  }
}

export const installLeak = (kind: 'messages' | 'detached', client: StreamChat) => {
  console.warn('[perf-host] VALIDATION: deliberate leak', kind);
  const kept: unknown[] = (window.__perfLeak = []);
  if (kind === 'messages') {
    const watched = new Set<string>();
    const watch = () => {
      for (const channel of client.channelManager.values()) {
        if (watched.has(channel.cid)) continue;
        watched.add(channel.cid);
        channel.messagePaginator.state.subscribe((state) => {
          kept.push(structuredClone(state.items ?? []));
        });
      }
    };
    watch();
    setInterval(watch, 500);
    return;
  }
  new MutationObserver(() => {
    for (const el of document.querySelectorAll(
      '.str-chat__list, .str-chat__virtual-list',
    )) {
      if (!kept.includes(el)) kept.push(el);
    }
  }).observe(document.body, { childList: true, subtree: true });
};
