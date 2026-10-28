import { useEffect } from 'react';
import { useChatContext, useWorkspaceNavigation } from 'stream-chat-react';
import demoData from '../../../base/demo-data.json';

const castIds = demoData.users.map((user) => user.id);

const waitFor = <T extends Element>(find: () => T | null | undefined) =>
  new Promise<T>((resolve) => {
    const timer = setInterval(() => {
      const element = find();
      if (!element) return;
      clearInterval(timer);
      resolve(element);
    }, 100);
  });

/** Sets an input's value the way typing does, so React's onChange runs. */
const typeInto = (input: HTMLInputElement, text: string) => {
  Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')?.set?.call(
    input,
    text,
  );
  input.dispatchEvent(new Event('input', { bubbles: true }));
};

/**
 * For the screenshots only, not part of the recipe. Keeps the people search to the cookbook's cast,
 * so other users of the shared demo app never show up, and drives the dialog from the URL:
 *
 * - `?simulate=new-conversation` opens the dialog;
 * - `&people=Cara,Dan` picks those people by name, and `&name=<text>` types the conversation's name;
 * - `&start=1` presses Start conversation;
 * - `&draft=<text>` then types the text into the composer of the conversation it opened, and
 *   `&send=1` sends it.
 */
export const SimulateNewConversation = () => {
  const { client } = useChatContext();
  const { openChannels } = useWorkspaceNavigation();
  const params = new URLSearchParams(window.location.search);
  const draft = params.get('draft');
  const openChannel = openChannels[0];

  useEffect(() => {
    const queryUsers = client.queryUsers.bind(client);
    client.queryUsers = (request, requestOptions) =>
      queryUsers(
        {
          ...request,
          payload: {
            ...request?.payload,
            filter_conditions: {
              $and: [request?.payload?.filter_conditions ?? {}, { id: { $in: castIds } }],
            },
          },
        },
        requestOptions,
      );
    return () => {
      client.queryUsers = queryUsers;
    };
  }, [client]);

  useEffect(() => {
    if (params.get('simulate') !== 'new-conversation') return;
    let cancelled = false;

    void (async () => {
      // The header renders with the channel list, after the client connects.
      await waitFor(() => document.querySelector('.str-chat__channel-list-item'));
      const button = await waitFor(() =>
        document.querySelector<HTMLButtonElement>(
          '.cookbook-channel-list-header button[aria-label="New conversation"]',
        ),
      );
      if (cancelled) return;
      button.click();
      for (const name of params.get('people')?.split(',') ?? []) {
        // The avatar's initials come first in the text.
        const result = await waitFor(() =>
          [
            ...document.querySelectorAll<HTMLButtonElement>(
              '.cookbook-new-conversation__result-button',
            ),
          ].find((element) => element.textContent?.endsWith(name)),
        );
        if (cancelled) return;
        result.click();
      }
      const name = params.get('name');
      if (name) {
        // The name field is the dialog's only input that isn't the search.
        const input = await waitFor(() =>
          document.querySelector<HTMLInputElement>(
            '.cookbook-new-conversation input:not([type="search"])',
          ),
        );
        if (cancelled) return;
        typeInto(input, name);
      }
      if (params.get('start') === '1') {
        // Enabled once the picked people have rendered.
        const submit = await waitFor(() =>
          document.querySelector<HTMLButtonElement>(
            '.cookbook-new-conversation [type="submit"]:not(:disabled)',
          ),
        );
        if (!cancelled) submit.click();
      }
    })();

    return () => {
      cancelled = true;
    };
    // Runs once: the URL is read on load.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    // Types only into the conversation the dialog opened, not the channel `?channel=` opened first.
    if (!draft || !openChannel || openChannel.id === params.get('channel')) return;
    let cancelled = false;

    void (async () => {
      const textarea = await waitFor(() =>
        document.querySelector<HTMLTextAreaElement>('.str-chat__channel textarea'),
      );
      if (cancelled) return;
      textarea.focus();
      await openChannel.messageComposer.textComposer.handleChange({
        selection: { end: draft.length, start: draft.length },
        text: draft,
      });
      if (cancelled || params.get('send') !== '1') return;
      const send = await waitFor(() =>
        document.querySelector<HTMLButtonElement>(
          '.str-chat__channel .str-chat__send-button:not(:disabled)',
        ),
      );
      if (!cancelled) send.click();
    })();

    return () => {
      cancelled = true;
    };
    // Types once per opened channel.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [openChannel]);

  return null;
};
