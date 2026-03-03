import { useMessageComposer } from './hooks';
import { useStateStore } from '../../store';
import type { TextComposerState } from 'stream-chat';
import { IconCrossMedium, IconThunder } from '../Icons';
import { useMessageInputContext } from '../../context';

const textComposerStateSelector = ({ command }: TextComposerState) => ({ command });

export const CommandChip = () => {
  const { textComposer } = useMessageComposer();
  const { textareaRef } = useMessageInputContext();
  const { command } = useStateStore(textComposer.state, textComposerStateSelector);
  if (!command) return null;

  return (
    <div className='str-chat__command-chip'>
      <IconThunder />
      <span>{command.name}</span>
      <button
        className={'str-chat__command-chip__close-button'}
        onClick={() => {
          textComposer.setCommand(null);
          textareaRef.current?.focus();
        }}
      >
        <IconCrossMedium />
      </button>
    </div>
  );
};
