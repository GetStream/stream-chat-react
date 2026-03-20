import { useMessageComposerController } from './useMessageComposerController';
import { useEffect, useState } from 'react';

export const useCanCreatePoll = () => {
  const { pollComposer } = useMessageComposerController();
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
