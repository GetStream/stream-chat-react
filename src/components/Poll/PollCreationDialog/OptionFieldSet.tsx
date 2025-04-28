import clsx from 'clsx';
import React, { useCallback } from 'react';
import { FieldError } from '../../Form/FieldError';
import { DragAndDropContainer } from '../../DragAndDrop/DragAndDropContainer';
import { useTranslationContext } from '../../../context';
import { useMessageComposer } from '../../MessageInput';
import { useStateStore } from '../../../store';
import type { PollComposerState } from 'stream-chat';

const pollComposerStateSelector = (state: PollComposerState) => ({
  errors: state.errors.options,
  options: state.data.options,
});

export const OptionFieldSet = () => {
  const { pollComposer } = useMessageComposer();
  const { errors, options } = useStateStore(
    pollComposer.state,
    pollComposerStateSelector,
  );
  const { t } = useTranslationContext('OptionFieldSet');

  const onSetNewOrder = useCallback(
    (newOrder: number[]) => {
      const prevOptions = pollComposer.options;
      pollComposer.updateFields({ options: newOrder.map((index) => prevOptions[index]) });
    },
    [pollComposer],
  );

  const draggable = options.length > 1;

  return (
    <fieldset className='str-chat__form__field str-chat__form__input-fieldset'>
      <legend className='str-chat__form__field-label'>{t<string>('Options')}</legend>
      <DragAndDropContainer
        className='str-chat__form__input-fieldset__values'
        draggable={draggable}
        onSetNewOrder={onSetNewOrder}
      >
        {options.map((option, i) => {
          const error = errors?.[option.id];
          return (
            <div
              className={clsx('str-chat__form__input-field', {
                'str-chat__form__input-field--draggable': draggable,
                'str-chat__form__input-field--has-error': error,
              })}
              key={`new-poll-option-${i}`}
            >
              <div className='str-chat__form__input-field__value'>
                <FieldError
                  className='str-chat__form__input-field__error'
                  data-testid={'poll-option-input-field-error'}
                  text={error && t(error)}
                />
                <input
                  id={option.id}
                  onBlur={() => {
                    pollComposer.handleFieldBlur('options');
                  }}
                  onChange={(e) => {
                    pollComposer.updateFields({
                      options: { index: i, text: e.target.value },
                    });
                  }}
                  onKeyUp={(event) => {
                    if (event.key === 'Enter') {
                      const nextInputId = options[i + 1].id;
                      document.getElementById(nextInputId)?.focus();
                    }
                  }}
                  placeholder={t<string>('Add an option')}
                  type='text'
                  value={option.text}
                />
              </div>
              {draggable && <div className='str-chat__drag-handle' />}
            </div>
          );
        })}
      </DragAndDropContainer>
    </fieldset>
  );
};
