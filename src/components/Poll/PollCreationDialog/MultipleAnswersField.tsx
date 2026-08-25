import { POLL_COMPOSER_VALIDATION_CODE, pollComposerValidationError } from 'stream-chat';
import type { PollComposerState, PollComposerValidationCode } from 'stream-chat';
import React, { useMemo, useRef, useState } from 'react';
import { NumericInput } from '../../Form/NumericInput';
import { SwitchField, SwitchFieldLabel } from '../../Form/SwitchField';
import { useTranslationContext } from '../../../context';
import { useMessageComposerController } from '../../MessageComposer/hooks/useMessageComposerController';
import { useStateStore } from '../../../store';

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

  const knownValidationErrors = useMemo<
    Partial<Record<PollComposerValidationCode, string>>
  >(
    () => ({
      [POLL_COMPOSER_VALIDATION_CODE.maxVotesUniqueVoteEnforced]: t(
        'poll.multipleAnswersField.enforceUniqueVoteEnabled.label',
        'Enforce unique vote is enabled',
      ),
      [POLL_COMPOSER_VALIDATION_CODE.maxVotesNotNumeric]: t(
        'poll.multipleAnswersField.onlyNumbersAllowed.label',
        'Only numbers are allowed',
      ),
      [POLL_COMPOSER_VALIDATION_CODE.maxVotesOutOfRange]: t(
        'poll.multipleAnswersField.typeNumber210.label',
        'Type a number from 2 to 10',
      ),
    }),
    [t],
  );

  const multipleVotesEnabled = !enforce_unique_vote;
  const errorText = error && (knownValidationErrors[error.code] ?? error.message);
  const voteLimitSwitchId = 'max_votes_allowed_enabled';
  const voteLimitSwitchLabelId = `${voteLimitSwitchId}-label`;

  return (
    <div className='str-chat__form__switch-fieldset'>
      <SwitchField
        checked={multipleVotesEnabled}
        description={t(
          'poll.multipleAnswersField.selectMoreThanOne.description',
          'Select More Than One Option',
        )}
        id='enforce_unique_vote'
        onChange={(e) => {
          setVoteLimitEnabled(false);
          pollComposer.updateFields({ enforce_unique_vote: !e.target.checked });
        }}
        title={t('poll.multipleAnswersField.multipleVotes.title', 'Multiple Votes')}
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
              description={t(
                'poll.multipleAnswersField.chooseBetween210.description',
                'Choose Between 2 to 10 Options',
              )}
              htmlFor={voteLimitSwitchId}
              id={voteLimitSwitchLabelId}
              title={t(
                'poll.multipleAnswersField.limitVotesPerPerson.title',
                'Limit Votes per Person',
              )}
            />
            {voteLimitEnabled && (
              <NumericInput
                aria-label={t(
                  'poll.multipleAnswersField.maximumVotesPerPerson.ariaLabel',
                  'Maximum votes per person',
                )}
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
                      ? {
                          // Injected field errors take the same shape core produces, so the render
                          // path is identical whether the error came from here or from the composer.
                          max_votes_allowed: pollComposerValidationError(
                            POLL_COMPOSER_VALIDATION_CODE.maxVotesNotNumeric,
                          ),
                        }
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
