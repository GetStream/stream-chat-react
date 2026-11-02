import { useId, useState } from 'react';
import type { TextComposerState } from 'stream-chat';
import {
  AdditionalMessageComposerActions,
  Button,
  createIcon,
  DialogAnchor,
  useDialog,
  useDialogIsOpen,
  useMessageComposerController,
  useStateStore,
} from 'stream-chat-react';
import type { Gif } from './gif';
import { toGiphyAttachment } from './gif';
import { GifPicker } from './GifPicker';

const IconGif = createIcon(
  'IconGif',
  <>
    <rect
      fill='none'
      height='13'
      rx='3'
      stroke='currentColor'
      strokeWidth='1.5'
      width='18'
      x='1'
      y='3.5'
    />
    <text
      fill='currentColor'
      fontFamily='inherit'
      fontSize='7.5'
      fontWeight='700'
      textAnchor='middle'
      x='10'
      y='12.7'
    >
      GIF
    </text>
  </>,
);

const commandSelector = ({ command }: TextComposerState) => ({ command });

/** The GIF button: opens the picker above itself; picking a GIF adds it to the composer. */
export const GifButton = () => {
  // The channel's and the thread's composer each have a button, so each needs its own dialog.
  const dialogId = `gif-picker-${useId()}`;
  const dialog = useDialog({ id: dialogId });
  const isOpen = useDialogIsOpen(dialogId);
  const [button, setButton] = useState<HTMLButtonElement | null>(null);
  const messageComposer = useMessageComposerController();
  const { command } = useStateStore(messageComposer.textComposer.state, commandSelector);

  // A command takes the whole composer, as the default actions next to the input assume.
  if (command) return null;

  const pick = (gif: Gif) => {
    messageComposer.attachmentManager.upsertAttachments([toGiphyAttachment(gif)]);
    dialog.close();
  };

  return (
    <>
      <Button
        appearance='ghost'
        aria-expanded={isOpen}
        aria-label='Add a GIF'
        circular
        className='cookbook-gif-button'
        onClick={() => dialog.toggle()}
        ref={setButton}
        size='sm'
        variant='secondary'
      >
        <IconGif />
      </Button>
      <DialogAnchor
        aria-label='Choose a GIF'
        id={dialogId}
        offset={8}
        placement='top-end'
        referenceElement={button}
        // Out of the tab order, so opening the picker focuses its search field.
        tabIndex={-1}
        trapFocus
      >
        <GifPicker onPick={pick} />
      </DialogAnchor>
    </>
  );
};

/** The area after the composer's input: the SDK's default, which holds the emoji picker, and the GIF button. */
export const ComposerActionsWithGifButton = () => (
  <>
    <AdditionalMessageComposerActions />
    <GifButton />
  </>
);
