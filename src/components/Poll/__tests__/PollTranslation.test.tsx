import React from 'react';
import { Poll } from 'stream-chat';
import type { Channel, StreamChat } from 'stream-chat';
import { fromPartial } from '@total-typescript/shoehorn';
import { render, screen, waitFor } from '@testing-library/react';
import { axe } from '../../../../axe-helper';
import { PollHeader } from '../PollHeader';
import { PollOptionList } from '../PollOptionList';
import { PollAnswerList } from '../PollActions/PollAnswerList';
import { PollOptionsFullList } from '../PollActions/PollOptionsFullList';
import { PollResults } from '../PollActions/PollResults/PollResults';
import {
  ChannelInstanceProvider,
  ChatProvider,
  MessageProvider,
  ModalDialogManagerProvider,
  PollProvider,
  TranslationProvider,
} from '../../../context';
import {
  generateChannelState,
  generateMessage,
  generatePoll,
  getTestClientWithUser,
  mockChatContext,
  mockMessageContext,
  mockTranslationContextValue,
} from '../../../mock-builders';

const TITLE_SELECTOR = '.str-chat__poll-title';
const OPTION_TEXT_SELECTOR = '.str-chat__poll-option-text';
const QUESTION_SELECTOR = '.str-chat__modal__poll-question__text';
const RESULTS_OPTION_TEXT_SELECTOR = '.str-chat__poll-option__option-text';
const ANSWER_TEXT_SELECTOR = '.str-chat__poll-answer__text';

const pollData = generatePoll({
  latest_answers: [],
  latest_votes_by_option: {},
  name: 'Favourite fruit?',
  name_i18n: { es_text: '¿Fruta favorita?', language: 'en' },
  options: [
    { id: 'apples', text: 'Apples', text_i18n: { es_text: 'Manzanas' } },
    { id: 'bananas', text: 'Bananas', text_i18n: { es_text: 'Plátanos' } },
    { id: 'cherries', text: 'Cherries' },
  ],
  own_votes: [],
  vote_count: 0,
  vote_counts_by_option: {},
});

const answer = {
  answer_text: 'Tasty',
  answer_text_i18n: { es_text: 'Sabroso', language: 'en' },
  created_at: pollData.created_at,
  id: 'answer-1',
  is_answer: true,
  option_id: '',
  poll_id: pollData.id,
  updated_at: pollData.updated_at,
  user: { id: 'commenter', name: 'Commenter' },
};

const makePoll = () => {
  const poll = new Poll({ client: fromPartial<StreamChat>({}), poll: pollData });
  vi.spyOn(poll, 'queryAnswers').mockResolvedValue(
    fromPartial({ next: undefined, votes: [answer] }),
  );
  return poll;
};

const channel = fromPartial<Channel>({
  cid: 'messaging:poll-translation-test',
  state: generateChannelState({ ownCapabilities: ['cast-poll-vote'] }),
});

describe('poll translations', () => {
  let chatClient: StreamChat;

  beforeAll(async () => {
    chatClient = await getTestClientWithUser();
  });

  const renderPoll = ({
    children,
    translationView,
    userLanguage,
    withMessage = true,
  }: {
    children?: React.ReactNode;
    translationView?: 'original' | 'translated';
    userLanguage: string;
    withMessage?: boolean;
  }) => {
    const poll = makePoll();
    const content = (
      <PollProvider poll={poll}>
        {children ?? (
          <>
            <PollHeader />
            {withMessage && <PollOptionList />}
          </>
        )}
      </PollProvider>
    );
    return render(
      <ChatProvider value={mockChatContext({ client: chatClient })}>
        <ChannelInstanceProvider value={{ channel }}>
          <ModalDialogManagerProvider>
            <TranslationProvider value={mockTranslationContextValue({ userLanguage })}>
              {withMessage ? (
                <MessageProvider
                  value={mockMessageContext({
                    message: generateMessage({ poll: pollData }),
                    translationView,
                  })}
                >
                  {content}
                </MessageProvider>
              ) : (
                content
              )}
            </TranslationProvider>
          </ModalDialogManagerProvider>
        </ChannelInstanceProvider>
      </ChatProvider>,
    );
  };

  const textsOf = (container: HTMLElement, selector: string) =>
    [...container.querySelectorAll(selector)].map((el) => el.textContent);
  const optionTexts = (container: HTMLElement) =>
    textsOf(container, OPTION_TEXT_SELECTOR);

  it('renders the question and options in the user language', async () => {
    const { container } = renderPoll({
      translationView: 'translated',
      userLanguage: 'es',
    });
    expect(container.querySelector(TITLE_SELECTOR)).toHaveTextContent('¿Fruta favorita?');
    // An option without a translation falls back to its original text.
    expect(optionTexts(container)).toEqual(['Manzanas', 'Plátanos', 'Cherries']);
    expect(await axe(container)).toHaveNoViolations();
  });

  it("renders the originals when the message's view is 'original'", () => {
    const { container } = renderPoll({ translationView: 'original', userLanguage: 'es' });
    expect(container.querySelector(TITLE_SELECTOR)).toHaveTextContent('Favourite fruit?');
    expect(optionTexts(container)).toEqual(['Apples', 'Bananas', 'Cherries']);
  });

  it('renders the originals when there is no translation for the user language', () => {
    const { container } = renderPoll({
      translationView: 'translated',
      userLanguage: 'de',
    });
    expect(container.querySelector(TITLE_SELECTOR)).toHaveTextContent('Favourite fruit?');
    expect(optionTexts(container)).toEqual(['Apples', 'Bananas', 'Cherries']);
  });

  it('adds no MessageContext requirement to the poll header', () => {
    renderPoll({ userLanguage: 'es', withMessage: false });
    expect(screen.getByText('¿Fruta favorita?')).toBeInTheDocument();
  });

  describe('dialogs', () => {
    it('translates the question and options in the results', async () => {
      const { container } = renderPoll({
        children: <PollResults />,
        translationView: 'translated',
        userLanguage: 'es',
      });
      expect(container.querySelector(QUESTION_SELECTOR)).toHaveTextContent(
        '¿Fruta favorita?',
      );
      expect(textsOf(container, RESULTS_OPTION_TEXT_SELECTOR)).toEqual([
        'Manzanas',
        'Plátanos',
        'Cherries',
      ]);
      expect(await axe(container)).toHaveNoViolations();
    });

    it("shows the originals in the results when the message's view is 'original'", () => {
      const { container } = renderPoll({
        children: <PollResults />,
        translationView: 'original',
        userLanguage: 'es',
      });
      expect(container.querySelector(QUESTION_SELECTOR)).toHaveTextContent(
        'Favourite fruit?',
      );
      expect(textsOf(container, RESULTS_OPTION_TEXT_SELECTOR)).toEqual([
        'Apples',
        'Bananas',
        'Cherries',
      ]);
    });

    it('translates the question and options in the full option list', async () => {
      const { container } = renderPoll({
        children: <PollOptionsFullList />,
        translationView: 'translated',
        userLanguage: 'es',
      });
      expect(container.querySelector(QUESTION_SELECTOR)).toHaveTextContent(
        '¿Fruta favorita?',
      );
      expect(optionTexts(container)).toEqual(['Manzanas', 'Plátanos', 'Cherries']);
      expect(await axe(container)).toHaveNoViolations();
    });

    it('translates the comments in the answer list', async () => {
      const { container } = renderPoll({
        children: <PollAnswerList onUpdateOwnAnswerClick={vi.fn()} />,
        translationView: 'translated',
        userLanguage: 'es',
      });
      await waitFor(() =>
        expect(textsOf(container, ANSWER_TEXT_SELECTOR)).toEqual(['Sabroso']),
      );
      expect(await axe(container)).toHaveNoViolations();
    });

    it("shows the original comments when the message's view is 'original'", async () => {
      const { container } = renderPoll({
        children: <PollAnswerList onUpdateOwnAnswerClick={vi.fn()} />,
        translationView: 'original',
        userLanguage: 'es',
      });
      await waitFor(() =>
        expect(textsOf(container, ANSWER_TEXT_SELECTOR)).toEqual(['Tasty']),
      );
    });
  });
});
