import React from 'react';
import { render, screen } from '@testing-library/react';
import { Poll } from 'stream-chat';

import { PollOptionWithVotesList } from '../PollResults/PollOptionWithVotesList';
import {
  ChatProvider,
  PollProvider,
  TranslationProvider,
  WithComponents,
} from '../../../../context';
import {
  generatePoll,
  generateUser,
  getTestClientWithUser,
  mockChatContext,
  mockTranslationContextValue,
} from '../../../../mock-builders';
import { mockT } from '../../../../mock-builders/translator';

vi.mock('../../hooks', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../../hooks')>()),
  usePollOptionVotesPagination: () => ({
    hasNextPage: true,
    loading: true,
    loadMore: vi.fn(),
    votes: [],
  }),
}));

describe('PollOptionWithVotesList', () => {
  it('renders the LoadingIndicator from ComponentContext while the next page loads', async () => {
    const user = generateUser();
    const client = await getTestClientWithUser(user);
    const pollData = generatePoll();
    const poll = new Poll({ client, poll: pollData });
    const CustomLoadingIndicator = () => <div data-testid='custom-loading-indicator' />;

    const { container } = render(
      <ChatProvider value={mockChatContext({ client })}>
        <TranslationProvider value={mockTranslationContextValue({ t: mockT })}>
          <PollProvider poll={poll}>
            <WithComponents overrides={{ LoadingIndicator: CustomLoadingIndicator }}>
              <PollOptionWithVotesList
                option={pollData.options[0]}
                optionOrderNumber={1}
              />
            </WithComponents>
          </PollProvider>
        </TranslationProvider>
      </ChatProvider>,
    );

    expect(screen.getByTestId('custom-loading-indicator')).toBeInTheDocument();
    expect(
      container.querySelector('.str-chat__loading-indicator'),
    ).not.toBeInTheDocument();
  });
});
