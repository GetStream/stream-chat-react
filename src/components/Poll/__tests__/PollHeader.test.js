import React from 'react';
import { render } from '@testing-library/react';
import '@testing-library/jest-dom';
import { PollHeader } from '../PollHeader';
import { PollProvider, TranslationProvider } from '../../../context';
import { Poll } from 'stream-chat';
import { generatePoll } from '../../../mock-builders';

const TITLE_SELECTOR = '.str-chat__poll-title';
const SUBTITLE_SELECTOR = '.str-chat__poll-subtitle';

const t = (v) => v;

const renderComponent = ({ poll }) =>
  render(
    <TranslationProvider value={{ t }}>
      <PollProvider poll={poll}>
        <PollHeader />
      </PollProvider>
    </TranslationProvider>,
  );

describe('PollHeader', () => {
  it('should not render if poll name is missing', () => {
    const pollData = generatePoll({ name: '' });
    const { container } = renderComponent({
      poll: new Poll({ client: {}, poll: pollData }),
    });
    expect(container).toBeEmptyDOMElement();
  });

  it('should render vote ended header', () => {
    const pollData = generatePoll({ is_closed: true });
    const { container } = renderComponent({
      poll: new Poll({ client: {}, poll: pollData }),
    });
    const nameDiv = container.querySelector(TITLE_SELECTOR);
    const subtitleDiv = container.querySelector(SUBTITLE_SELECTOR);
    expect(nameDiv).toHaveTextContent(pollData.name);
    expect(subtitleDiv).toHaveTextContent('Vote ended');
  });

  it('should render select one header', () => {
    const pollData = generatePoll({ enforce_unique_vote: true });
    const { container } = renderComponent({
      poll: new Poll({ client: {}, poll: pollData }),
    });
    const nameDiv = container.querySelector(TITLE_SELECTOR);
    const subtitleDiv = container.querySelector(SUBTITLE_SELECTOR);
    expect(nameDiv).toHaveTextContent(pollData.name);
    expect(subtitleDiv).toHaveTextContent('Select one');
  });

  it('should render Select up to {{count}} header', () => {
    const pollData = generatePoll({ max_votes_allowed: 2 });
    const { container } = renderComponent({
      poll: new Poll({ client: {}, poll: pollData }),
    });
    const nameDiv = container.querySelector(TITLE_SELECTOR);
    const subtitleDiv = container.querySelector(SUBTITLE_SELECTOR);
    expect(nameDiv).toHaveTextContent(pollData.name);
    expect(subtitleDiv).toHaveTextContent('Select up to {{count}}');
  });

  it('should render Select one or more header', () => {
    const pollData = generatePoll({ max_votes_allowed: undefined });
    const { container } = renderComponent({
      poll: new Poll({ client: {}, poll: pollData }),
    });
    const nameDiv = container.querySelector(TITLE_SELECTOR);
    const subtitleDiv = container.querySelector(SUBTITLE_SELECTOR);
    expect(nameDiv).toHaveTextContent(pollData.name);
    expect(subtitleDiv).toHaveTextContent('Select one or more');
  });

  it('should render Select one header if only one option is available', () => {
    const pollData = generatePoll({
      max_votes_allowed: undefined,
      options: [
        {
          id: '85610252-7d50-429c-8183-51a7eba46246',
          text: 'A',
        },
      ],
    });
    const { container } = renderComponent({
      poll: new Poll({ client: {}, poll: pollData }),
    });
    const nameDiv = container.querySelector(TITLE_SELECTOR);
    const subtitleDiv = container.querySelector(SUBTITLE_SELECTOR);
    expect(nameDiv).toHaveTextContent(pollData.name);
    expect(subtitleDiv).toHaveTextContent('Select one');
  });

  it('should render no header text if no options available', () => {
    const pollData = generatePoll({ max_votes_allowed: undefined, options: [] });
    const { container } = renderComponent({
      poll: new Poll({ client: {}, poll: pollData }),
    });
    const nameDiv = container.querySelector(TITLE_SELECTOR);
    const subtitleDiv = container.querySelector(SUBTITLE_SELECTOR);
    expect(nameDiv).toHaveTextContent(pollData.name);
    expect(subtitleDiv).toHaveTextContent('');
  });
});
