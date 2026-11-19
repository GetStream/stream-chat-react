import { useEffect, useMemo, useState } from 'react';
import { toScheduledMessagePreview } from 'stream-chat';
import type {
  LocalMessage,
  Poll,
  PollState,
  ScheduledMessageResponse,
} from 'stream-chat';

import { useChatContext } from '../../../context';
import { useStateStore } from '../../../store';

const selectPollPreview = ({ created_by, name, vote_count }: PollState) => ({
  created_by,
  name,
  vote_count,
});

/**
 * The scheduled message as a message to preview. A scheduled poll carries only its ID, so the poll
 * is taken from `client.polls`, loaded once when it is not there yet.
 */
export const useScheduledMessagePreview = (
  scheduledMessage: ScheduledMessageResponse,
): LocalMessage => {
  const { client } = useChatContext();
  const pollId = scheduledMessage.message.poll_id;
  const [loadedPoll, setLoadedPoll] = useState<Poll>();
  const poll = pollId
    ? (client.polls.fromState(pollId) ??
      (loadedPoll?.id === pollId ? loadedPoll : undefined))
    : undefined;

  useEffect(() => {
    if (!pollId || client.polls.fromState(pollId)) return;
    let isActive = true;
    client.polls
      .getPoll(pollId)
      .then((fetched) => {
        if (isActive && fetched) setLoadedPoll(fetched);
      })
      .catch(() => undefined);
    return () => {
      isActive = false;
    };
  }, [client, pollId]);

  const pollPreview = useStateStore(poll?.state, selectPollPreview);

  return useMemo(() => {
    const preview = toScheduledMessagePreview(scheduledMessage);
    if (!pollId || !pollPreview) return preview;
    return { ...preview, poll: { ...pollPreview, id: pollId } as LocalMessage['poll'] };
  }, [pollId, pollPreview, scheduledMessage]);
};
