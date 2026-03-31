import { useMessageComposerController } from './hooks';
import type { TextComposerState } from 'stream-chat';
import { IconBolt, IconXmark } from '../Icons';
import { useMessageComposerContext } from '../../context';

export type CommandChipProps = {
  command?: TextComposerState['command'];
};

export const CommandChip = ({ command }: CommandChipProps) => {
  const { textComposer } = useMessageComposerController();
  const { textareaRef } = useMessageComposerContext();
  if (!command) return null;

  return (
    <div className='str-chat__command-chip'>
      <IconBolt />
      <span>{command.name}</span>
      <button
        className={'str-chat__command-chip__close-button'}
        onClick={() => {
          textComposer.setCommand(null);
          textareaRef.current?.focus();
        }}
      >
        <IconXmark />
      </button>
    </div>
  );
};
