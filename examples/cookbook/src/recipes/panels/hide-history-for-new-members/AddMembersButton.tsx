import type { ChannelUpdateOptions } from 'stream-chat';
import { useId, useState } from 'react';
import { Button, GlobalModal, Prompt, useChannel } from 'stream-chat-react';
import './AddMembersButton.css';

type HistoryMode = 'none' | 'today' | 'all' | 'custom';

const historyOptions: { label: string; mode: HistoryMode }[] = [
  { label: "don't include", mode: 'none' },
  { label: 'from today', mode: 'today' },
  { label: 'from the beginning', mode: 'all' },
  { label: 'custom', mode: 'custom' },
];

// The addMembers options for a choice, or undefined when the custom date isn't valid.
const getHistoryOptions = (
  mode: HistoryMode,
  customInput: string,
): ChannelUpdateOptions | undefined => {
  if (mode === 'all') return {};
  if (mode === 'none') return { hide_history: true };

  if (mode === 'today') {
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    return { hide_history_before: startOfToday };
  }

  const cutoff = new Date(customInput);
  if (Number.isNaN(cutoff.getTime()) || cutoff > new Date()) return undefined;
  return { hide_history_before: cutoff };
};

export const AddMembersButton = ({ memberIds }: { memberIds: string[] }) => {
  const channel = useChannel();
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<HistoryMode>('none');
  const [customInput, setCustomInput] = useState('');
  const [adding, setAdding] = useState(false);
  const errorId = useId();

  const options = getHistoryOptions(mode, customInput);
  // The error waits until the user has typed a date.
  const showCustomError = mode === 'custom' && customInput !== '' && !options;

  // Every time the dialog opens, it starts from the most private choice.
  const openDialog = () => {
    setMode('none');
    setCustomInput('');
    setOpen(true);
  };
  const close = () => setOpen(false);

  const handleAdd = async () => {
    if (!options || adding) return;
    setAdding(true);
    try {
      await channel.addMembers({ members: memberIds, ...options });
      close();
    } catch (error) {
      console.error('Could not add the members', error);
    } finally {
      setAdding(false);
    }
  };

  return (
    <>
      <Button
        appearance='outline'
        className='cookbook-add-members'
        onClick={openDialog}
        size='sm'
        variant='secondary'
      >
        Add members
      </Button>
      <GlobalModal onClose={close} open={open}>
        <Prompt.Root>
          <Prompt.Header close={close} title='Include conversation history?' />
          <Prompt.Body>
            <div
              aria-label='Conversation history'
              className='cookbook-history-options'
              role='radiogroup'
            >
              {historyOptions.map((option) => (
                <label className='cookbook-history-option' key={option.mode}>
                  <input
                    checked={mode === option.mode}
                    name='history'
                    onChange={() => setMode(option.mode)}
                    type='radio'
                    value={option.mode}
                  />
                  <span>{option.label}</span>
                </label>
              ))}
            </div>
            {mode === 'custom' && (
              <div className='cookbook-history-custom'>
                <input
                  aria-describedby={showCustomError ? errorId : undefined}
                  aria-invalid={showCustomError}
                  aria-label='Show history from'
                  className='cookbook-history-custom__input'
                  onChange={(event) => setCustomInput(event.target.value)}
                  type='datetime-local'
                  value={customInput}
                />
                {showCustomError && (
                  <div className='cookbook-history-custom__error' id={errorId}>
                    Enter a valid date and time in the past
                  </div>
                )}
              </div>
            )}
          </Prompt.Body>
          <Prompt.Footer>
            <Prompt.FooterControls>
              <Prompt.FooterControlsButtonSecondary onClick={close}>
                Cancel
              </Prompt.FooterControlsButtonSecondary>
              <Prompt.FooterControlsButtonPrimary
                disabled={!options || adding}
                onClick={handleAdd}
              >
                Add
              </Prompt.FooterControlsButtonPrimary>
            </Prompt.FooterControls>
          </Prompt.Footer>
        </Prompt.Root>
      </GlobalModal>
    </>
  );
};
