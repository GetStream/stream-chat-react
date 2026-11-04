import { useEffect, useRef } from 'react';
import type { MouseEvent } from 'react';
import { useChatContext, useWorkspaceNavigation } from 'stream-chat-react';

/**
 * Screenshot helper, not part of the recipe. With `?beside=<channel id>`, once the channel from
 * `?channel=` is open, opens the other one as a ⌘-click on its row in the channel list would.
 */
export const SimulateCtrlClick = () => {
  const { client } = useChatContext();
  const { openChannel, openChannels } = useWorkspaceNavigation();
  const done = useRef(false);
  const besideId = new URLSearchParams(window.location.search).get('beside');

  useEffect(() => {
    if (!besideId || done.current || openChannels.length !== 1) return;
    done.current = true;
    const channel = client.channel('messaging', besideId);
    void channel.watch().then(() =>
      openChannel(channel, {
        // A row in the channel list passes its click; only the modifier keys matter here.
        event: { ctrlKey: false, metaKey: true } as MouseEvent,
      }),
    );
  }, [besideId, client, openChannel, openChannels.length]);

  return null;
};
