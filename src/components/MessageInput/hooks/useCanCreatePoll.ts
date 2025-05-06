import { useMessageComposer } from './useMessageComposer';
import { useEffect, useState } from 'react';

export const useCanCreatePoll = () => {
  const { pollComposer } = useMessageComposer();
  const [canCreatePoll, setCanCreatePoll] = useState(pollComposer.canCreatePoll);
  useEffect(
    () =>
      pollComposer.state.subscribe(() => {
        setCanCreatePoll(pollComposer.canCreatePoll);
      }),
    [pollComposer],
  );
  return canCreatePoll;
};
