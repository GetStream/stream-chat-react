import React, { useMemo, useRef, useState } from 'react';
import { NumericInput } from '../../Form/NumericInput';
import { SwitchField, SwitchFieldLabel } from '../../Form/SwitchField';
import { useTranslationContext } from '../../../context';
import { useMessageComposerController } from '../../MessageComposer/hooks/useMessageComposerController';
import { useStateStore } from '../../../store';
import type { PollComposerState } from 'stream-chat';

const pollComposerStateSelector = (state: PollComposerState) => ({
  enforce_unique_vote: state.data.enforce_unique_vote,
  error: state.errors.max_votes_allowed,
  max_votes_allowed: state.data.max_votes_allowed,
});

export const MultipleAnswersField = () => {
  const { t } = useTranslationContext();
  const { pollComposer } = useMessageComposerController();
  const { enforce_unique_vote, error, max_votes_allowed } = useStateStore(
    pollComposer.state,
    pollComposerStateSelector,
  );
  const [voteLimitEnabled, setVoteLimitEnabled] = useState(false);
  const maxVotesInputRef = useRef<HTMLInputElement | null>(null);

  const knownValidationErrors = useMemo<Record<string, string>>(
    () => ({
      'Enforce unique vote is enabled': t('Enforce unique vote is enabled'),
      'Type a number from 2 to 10': t('Type a number from 2 to 10'),
    }),
    [t],
  );

  const multipleVotesEnabled = !enforce_unique_vote;
  const errorText = error && knownValidationErrors[error];
  const voteLimitSwitchId = 'max_votes_allowed_enabled';
  const voteLimitSwitchLabelId = `${voteLimitSwitchId}-label`;

  return (
    <div className='str-chat__form__switch-fieldset'>
      <SwitchField
        checked={multipleVotesEnabled}
        description={t('Select more than one option')}
        id='enforce_unique_vote'
        onChange={(e) => {
          setVoteLimitEnabled(false);
          pollComposer.updateFields({ enforce_unique_vote: !e.target.checked });
        }}
        title={t('Multiple votes')}
      />
      {multipleVotesEnabled && (
        <SwitchField
          aria-labelledby={voteLimitSwitchLabelId}
          checked={voteLimitEnabled}
          fieldClassName='str-chat__multiple-answers-field__votes-limit-field'
          id={voteLimitSwitchId}
          onChange={(event) => {
            const nextVoteLimitEnabled = event.target.checked;
            setVoteLimitEnabled(nextVoteLimitEnabled);
            pollComposer.updateFields({ max_votes_allowed: '2' });
            if (!nextVoteLimitEnabled) return;
            requestAnimationFrame(() => {
              maxVotesInputRef.current?.focus();
            });
          }}
        >
          <div className='str-chat__multiple-answers-field__votes-limit-field__numeric-field'>
            <SwitchFieldLabel
              asError={!!errorText}
              description={t('Choose between 2 to 10 options')}
              htmlFor={voteLimitSwitchId}
              id={voteLimitSwitchLabelId}
              title={t('Limit votes per person')}
            />
            {voteLimitEnabled && (
              <NumericInput
                aria-label={t('Maximum votes per person')}
                id='max_votes_allowed'
                max={10}
                min={2}
                onBlur={() => {
                  pollComposer.handleFieldBlur('max_votes_allowed');
                }}
                onChange={(e) => {
                  const raw = e.target.value;
                  const nativeFieldValidation =
                    raw !== '' && !/^\d+$/.test(raw)
                      ? { max_votes_allowed: t('Only numbers are allowed') }
                      : undefined;
                  pollComposer.updateFields(
                    {
                      max_votes_allowed: nativeFieldValidation
                        ? pollComposer.max_votes_allowed
                        : raw,
                    },
                    nativeFieldValidation,
                  );
                }}
                ref={maxVotesInputRef}
                value={max_votes_allowed ?? ''}
              />
            )}
          </div>
        </SwitchField>
      )}
    </div>
  );
};
