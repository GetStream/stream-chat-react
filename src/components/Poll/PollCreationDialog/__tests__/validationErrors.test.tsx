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

// The composer reports a field error as `{ code, message }`, where `message` is untranslated
// English and not part of the client's public contract. Fields must resolve their copy from the
// code through `t()`. A test asserting English copy cannot catch a fallback to `message`, so `t`
// returns a marker and any text that is not a marker bypassed translation.
const marker = (key: string) => `__t(${key})__`;
const localizedT = ((key: string) => marker(key)) as ReturnType<
  typeof mockTranslationContextValue
>['t'];

const NAME_ERROR_TEST_ID = 'poll-name-input-field-error';
const OPTION_ERROR_TEST_ID = 'poll-option-input-field-error';

// A code the SDK's copy tables do not map, e.g. one the client added first. Fields fall back to
// its `message`, a literal here because `pollComposerValidationError` leaves it undefined for
// unknown codes.
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
      // the client's English fallback must never reach the DOM
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
    // Asserts against the DOM so deleting a copy table entry fails; comparing two lists derived
    // from POLL_COMPOSER_VALIDATION_CODE would only restate the constant.
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
      // not the client's untranslated English: proves the code is mapped, not merely handled
      expect(error).not.toHaveTextContent(UNMAPPED_MESSAGE);
    }
  });

  it('has a copy table entry for every code the client can emit', () => {
    // Literal, not derived from POLL_COMPOSER_VALIDATION_CODE: a tripwire for the client adding a
    // code, which would otherwise degrade silently to the generic "Error". When it fires, map the
    // new code in the relevant field and cover it above before updating this list.
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

  // The three `maxVotes:*` codes are not asserted against the DOM above: MultipleAnswersField never
  // renders their copy, because `errorText` only toggles error styling on the label.
});
