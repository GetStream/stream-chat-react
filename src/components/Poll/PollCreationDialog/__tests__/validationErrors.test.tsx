import React from 'react';
import { act, cleanup, render, screen } from '@testing-library/react';
import { POLL_COMPOSER_VALIDATION_CODE, pollComposerValidationError } from 'stream-chat';
import type { PollComposerValidationCode } from 'stream-chat';

import { NameField } from '../NameField';
import { OptionFieldSet } from '../OptionFieldSet';
import { Chat } from '../../../Chat';
import { Channel } from '../../../Channel';
import { TranslationProvider } from '../../../../context';
import {
  initClientWithChannels,
  mockTranslationContextValue,
} from '../../../../mock-builders';

// The poll composer reports a field error as `{ code, message }`, where `message` is UNTRANSLATED
// English that the client documents as not part of its public contract. These components must
// resolve their copy from the code through `t()` and never fall back to `message` — a regression
// there is invisible to a test that asserts English copy, because the translated default and the
// raw `message` are the same words.
//
// So `t` here returns a marker instead of the English default. Any string that is not a marker is
// therefore something that bypassed translation.
const marker = (key: string) => `__t(${key})__`;
const localizedT = ((key: string) => marker(key)) as ReturnType<
  typeof mockTranslationContextValue
>['t'];

const NAME_ERROR_TEST_ID = 'poll-name-input-field-error';
const OPTION_ERROR_TEST_ID = 'poll-option-input-field-error';

/**
 * A code the client emits that this SDK's copy tables do not map — e.g. one added to the client
 * before the SDK catches up. Such an error still carries the client's untranslated English
 * `message`, which is deliberately what the fields fall back to: it degrades to readable text
 * rather than to a blank field. (`pollComposerValidationError` leaves `message` undefined for an
 * unrecognized code, so the literal here is what actually exercises that fallback.)
 */
const UNMAPPED_CODE = 'validation:poll:unknown:future' as PollComposerValidationCode;
const UNMAPPED_MESSAGE = 'A future validation failure';
const unmappedError = { code: UNMAPPED_CODE, message: UNMAPPED_MESSAGE };

const renderField = async (
  field: React.ReactNode,
  seedErrors: (optionId: string) => Record<string, unknown>,
) => {
  const {
    channels: [channel],
    client,
  } = await initClientWithChannels();
  const { pollComposer } = channel.messageComposer;

  await act(() => {
    render(
      <Chat client={client}>
        <Channel channel={channel}>
          <TranslationProvider value={mockTranslationContextValue({ t: localizedT })}>
            {field}
          </TranslationProvider>
        </Channel>
      </Chat>,
    );
  });

  const optionId = pollComposer.state.getLatestValue().data.options[0].id;
  act(() => {
    pollComposer.state.partialNext({ errors: seedErrors(optionId) });
  });

  return { channel, client, pollComposer };
};

describe('poll field validation errors', () => {
  describe('NameField', () => {
    it('renders the translated copy for a known code, not the untranslated message', async () => {
      await renderField(<NameField />, () => ({
        name: pollComposerValidationError(POLL_COMPOSER_VALIDATION_CODE.nameRequired),
      }));

      const error = screen.getByTestId(NAME_ERROR_TEST_ID);
      expect(error).toHaveTextContent(marker('poll.nameField.questionRequired.label'));
      // the guard: the client's English fallback must never reach the DOM
      expect(error).not.toHaveTextContent('Question is required');
    });

    it("falls back to the client's message for an unmapped code", async () => {
      await renderField(<NameField />, () => ({ name: unmappedError }));

      const error = screen.getByTestId(NAME_ERROR_TEST_ID);
      expect(error).toHaveTextContent(UNMAPPED_MESSAGE);
      // the raw identifier must never be what the user sees
      expect(error).not.toHaveTextContent(UNMAPPED_CODE);
    });
  });

  describe('OptionFieldSet', () => {
    it.each([
      [
        POLL_COMPOSER_VALIDATION_CODE.optionDuplicate,
        'poll.suggestPollOption.optionAlreadyExists.label',
      ],
      [
        POLL_COMPOSER_VALIDATION_CODE.optionEmpty,
        'poll.optionFieldSet.optionEmpty.label',
      ],
    ])('renders the translated copy for %s', async (code, expectedKey) => {
      await renderField(<OptionFieldSet />, (optionId) => ({
        options: { [optionId]: pollComposerValidationError(code) },
      }));

      expect(screen.getByTestId(OPTION_ERROR_TEST_ID)).toHaveTextContent(
        marker(expectedKey),
      );
    });

    it("falls back to the client's message for an unmapped code", async () => {
      await renderField(<OptionFieldSet />, (optionId) => ({
        options: { [optionId]: unmappedError },
      }));

      const error = screen.getByTestId(OPTION_ERROR_TEST_ID);
      expect(error).toHaveTextContent(UNMAPPED_MESSAGE);
      expect(error).not.toHaveTextContent(UNMAPPED_CODE);
    });
  });

  it('renders distinct translated copy for every code a text field can receive', async () => {
    // Asserts against the DOM, so deleting a mapping from a component's copy table fails here.
    // (Comparing two lists both derived from POLL_COMPOSER_VALIDATION_CODE would prove nothing —
    // it would only restate the constant.)
    const cases = [
      {
        code: POLL_COMPOSER_VALIDATION_CODE.nameRequired,
        field: <NameField />,
        key: 'poll.nameField.questionRequired.label',
        seed: (code: PollComposerValidationCode) => () => ({
          name: pollComposerValidationError(code),
        }),
        testId: NAME_ERROR_TEST_ID,
      },
      {
        code: POLL_COMPOSER_VALIDATION_CODE.optionDuplicate,
        field: <OptionFieldSet />,
        key: 'poll.suggestPollOption.optionAlreadyExists.label',
        seed: (code: PollComposerValidationCode) => (optionId: string) => ({
          options: { [optionId]: pollComposerValidationError(code) },
        }),
        testId: OPTION_ERROR_TEST_ID,
      },
      {
        code: POLL_COMPOSER_VALIDATION_CODE.optionEmpty,
        field: <OptionFieldSet />,
        key: 'poll.optionFieldSet.optionEmpty.label',
        seed: (code: PollComposerValidationCode) => (optionId: string) => ({
          options: { [optionId]: pollComposerValidationError(code) },
        }),
        testId: OPTION_ERROR_TEST_ID,
      },
    ];

    for (const { code, field, key, seed, testId } of cases) {
      cleanup();
      await renderField(field, seed(code));
      const error = screen.getByTestId(testId);
      expect(error).toHaveTextContent(marker(key));
      // not the client's untranslated English — proves this code is mapped, not merely handled
      expect(error).not.toHaveTextContent(UNMAPPED_MESSAGE);
    }
  });

  it('has a copy table entry for every code the client can emit', () => {
    // Deliberately literal, NOT derived from POLL_COMPOSER_VALIDATION_CODE: this is a tripwire for
    // the client adding a code, which would otherwise degrade silently to the generic "Error".
    // When it fires, map the new code in the relevant field (and cover it above) before updating
    // this list.
    expect(Object.values(POLL_COMPOSER_VALIDATION_CODE).sort()).toEqual(
      [
        'validation:poll:maxVotes:notNumeric',
        'validation:poll:maxVotes:outOfRange',
        'validation:poll:maxVotes:uniqueVoteEnforced',
        'validation:poll:name:required',
        'validation:poll:option:duplicate',
        'validation:poll:option:empty',
      ].sort(),
    );
  });

  // NOTE: the three `maxVotes:*` codes are NOT asserted against the DOM above, because
  // MultipleAnswersField never renders its copy — `errorText` only toggles error styling on the
  // label (NumericInput has no error-message slot). Its `knownValidationErrors` entries are
  // therefore unreachable today; see the note in that component.
});
