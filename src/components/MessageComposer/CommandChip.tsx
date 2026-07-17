import { useMessageComposerController } from './hooks';
import type { TextComposerState } from 'stream-chat';
import { IconBolt as DefaultIconBolt, IconXmark as DefaultIconXmark } from '../Icons';
import {
  useComponentContext,
  useMessageComposerContext,
  useTranslationContext,
} from '../../context';

export type CommandChipProps = {
  command?: TextComposerState['command'];
};

export const CommandChip = ({ command }: CommandChipProps) => {
  const { icons: { IconBolt = DefaultIconBolt, IconXmark = DefaultIconXmark } = {} } =
    useComponentContext();

  const { textComposer } = useMessageComposerController();
  const { textareaRef } = useMessageComposerContext();
  const { t } = useTranslationContext();
  if (!command) return null;

  return (
    <div className='str-chat__command-chip'>
      <IconBolt />
      <span aria-hidden='true' tabIndex={-1}>
        {command.name}
      </span>
      <button
        aria-label={t('Exit command {{ command }}', { command: command.name })}
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
