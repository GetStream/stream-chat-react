import { settle, type SettleResult } from './settle';

// WB-01: what happens while the tab is hidden, and the catch-up when it comes back.
//
// countHiddenChanges(): opt-in (a MutationObserver on the whole channel view costs something), it
// counts DOM changes in the channel view made while the document is hidden. Non-zero means React
// kept committing in the background; the prod build has no render counter to ask.
//
// settleAfterVisible(): armed while hidden; when the tab becomes visible, settles the view from that
// moment (perf:visible) with `expectText`, the newest live marker, on screen.

let hiddenChanges = 0;
let observer: MutationObserver | undefined;

export const countHiddenChanges = () => {
  hiddenChanges = 0;
  observer?.disconnect();
  observer = new MutationObserver((records) => {
    if (document.visibilityState === 'hidden') hiddenChanges += records.length;
  });
  observer.observe(document.body, {
    characterData: true,
    childList: true,
    subtree: true,
  });
};

export const hiddenChangeCount = () => {
  observer?.disconnect();
  observer = undefined;
  return hiddenChanges;
};

export const settleAfterVisible = (expectText: string, timeoutMs = 60_000) =>
  new Promise<SettleResult>((resolve, reject) => {
    const start = () => {
      settle(performance.now(), expectText, { timeoutMs }).then(resolve, reject);
    };
    if (document.visibilityState === 'visible') return start();
    const onChange = () => {
      if (document.visibilityState !== 'visible') return;
      document.removeEventListener('visibilitychange', onChange);
      start();
    };
    document.addEventListener('visibilitychange', onChange);
  });
