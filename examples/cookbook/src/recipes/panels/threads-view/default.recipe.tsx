import { ChatView } from 'stream-chat-react/slot-layout';
import type { RecipeConfig } from '../../../base/recipe';
import type { ClickStep } from '../../../base/useClickInTurn';
import { useClickInTurn } from '../../../base/useClickInTurn';
import { OnlyCookbookThreads } from './OnlyCookbookThreads';
import { MarkDemoThreadsReadLocally } from './ScreenshotHelpers';
import { ThreadsView } from './ThreadsView';

// For the screenshots: `?view=threads` clicks the Threads button, and `&row=<parent message id>`
// then clicks that thread's row, as the user would.
const params = new URLSearchParams(window.location.search);
const row = params.get('row');
const clickSteps: ClickStep[] =
  params.get('view') === 'threads'
    ? [
        {
          find: () =>
            document.querySelector<HTMLElement>(
              '.str-chat__chat-view__selector-button-container:nth-child(2) button',
            ),
        },
        ...(row
          ? [
              {
                find: () =>
                  document.querySelector<HTMLElement>(
                    `.cookbook-thread-row[data-thread-id="${CSS.escape(row)}"]`,
                  ),
              },
            ]
          : []),
      ]
    : [];

const OpenThreadsFromUrl = () => {
  useClickInTurn(clickSteps);
  return null;
};

const recipe: RecipeConfig = {
  chatViewChildren: (
    <>
      <ChatView.Selector />
      <OpenThreadsFromUrl />
      <MarkDemoThreadsReadLocally />
    </>
  ),
  // A threads layout with one slot for the picked thread, beside the base app's channels layout.
  layouts: [{ id: 'threads', slots: ['thread'] }],
  views: { threads: <ThreadsView /> },
  Wrapper: OnlyCookbookThreads,
};

export default recipe;
