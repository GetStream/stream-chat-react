import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
import { toHaveNoViolations } from 'jest-axe';
import React from 'react';
import { nanoid } from 'nanoid';
import { axe } from '../../../../axe-helper';

import {
  ChannelActionProvider,
  ChannelStateProvider,
  ChatProvider,
  ComponentProvider,
  DialogManagerProvider,
  TranslationProvider,
} from '../../../context';
import {
  generateFileAttachment,
  generateMessage,
  generateUser,
  initClientWithChannels,
} from '../../../mock-builders';

import { Message } from '../Message';
import { MessageSimple } from '../MessageSimple';
import { QuotedMessage } from '../QuotedMessage';
import { generatePoll } from '../../../mock-builders/generator/poll';

expect.extend(toHaveNoViolations);

const quotedPollPreviewClassSelector = '.str-chat__quoted-poll-preview';
const quotedMessageTestId = 'quoted-message';
const quotedMessageContentsTestId = 'quoted-message-contents';
const quotedMessageTextTestId = 'quoted-message-text';
const quotedAttachmentListTestId = 'quoted-attachment-list';
const quotingAttachmentListTestId = 'quoting-attachment-list';
const avatarTestId = 'avatar';
const quotedText = 'X';
const deletedMessageText = 'This message was deleted...';

const Attachment = (props) => <div data-testid={props.attachments[0].testId} />;

const alice = generateUser({ name: 'alice' });
const jumpToMessageMock = jest.fn();

async function renderQuotedMessage({
  componentContext,
  customChannel,
  customClient,
  customProps,
} = {}) {
  const {
    channels: [channel],
    client,
  } = await initClientWithChannels({ customUser: alice });
  const channelConfig = (customChannel ?? channel).getConfig();
  const customDateTimeParser = jest.fn(() => ({ format: jest.fn() }));

  return render(
    <ChatProvider value={{ client: customClient ?? client }}>
      <ChannelStateProvider value={{ channel: customChannel ?? channel, channelConfig }}>
        <ChannelActionProvider value={{ jumpToMessage: jumpToMessageMock }}>
          <TranslationProvider
            value={{
              t: (key) => key,
              tDateTimeParser: customDateTimeParser,
              userLanguage: 'en',
            }}
          >
            <ComponentProvider
              value={{
                Attachment,
                Message() {
                  return <MessageSimple channelConfig={channelConfig} />;
                },
                ...componentContext,
              }}
            >
              <DialogManagerProvider id='quoted-message-dialog-manager-provider'>
                <Message {...customProps}>
                  <QuotedMessage {...customProps} />
                </Message>
              </DialogManagerProvider>
            </ComponentProvider>
          </TranslationProvider>
        </ChannelActionProvider>
      </ChannelStateProvider>
    </ChatProvider>,
  );
}

describe('QuotedMessage', () => {
  it('should not be rendered if no message.quoted_message', async () => {
    const { container, queryByTestId } = await renderQuotedMessage({
      customProps: { message: {} },
    });
    expect(queryByTestId(quotedMessageTestId)).not.toBeInTheDocument();
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
  it('should not be rendered if no text neither attachments', async () => {
    const message = { quoted_message: {} };
    const { container, queryByTestId } = await renderQuotedMessage({
      customProps: { message },
    });
    expect(queryByTestId(quotedMessageTestId)).not.toBeInTheDocument();
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('renders proper markdown (through default renderText fn)', async () => {
    const messageText = 'hey @John Cena';
    const { container, findByTestId, findByText, queryByTestId } =
      await renderQuotedMessage({
        customProps: {
          message: {
            quoted_message: {
              mentioned_users: [{ id: 'john', name: 'John Cena' }],
              text: messageText,
            },
          },
        },
      });

    expect(await findByText('@John Cena')).toHaveAttribute('data-user-id');
    expect((await findByTestId('quoted-message-text')).textContent).toEqual(messageText);
    expect(queryByTestId(quotedAttachmentListTestId)).not.toBeInTheDocument();
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('uses custom renderText fn if provided', async () => {
    const messageText = nanoid();
    const fn = jest
      .fn()
      .mockReturnValue(<div data-testid={messageText}>{messageText}</div>);

    const { container, findByTestId, queryByTestId } = await renderQuotedMessage({
      customProps: {
        message: {
          quoted_message: {
            text: messageText,
          },
        },
        renderText: fn,
      },
    });

    expect(fn).toHaveBeenCalled();
    expect((await findByTestId('quoted-message-text')).textContent).toEqual(messageText);
    expect(queryByTestId(quotedAttachmentListTestId)).not.toBeInTheDocument();
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('should render quoted message attachments', async () => {
    const message = {
      quoted_message: {
        attachments: [generateFileAttachment({ testId: quotedAttachmentListTestId })],
        text: '',
      },
    };
    const { container, queryByTestId } = await renderQuotedMessage({
      customProps: { message },
    });
    expect(queryByTestId(quotedAttachmentListTestId)).toBeInTheDocument();
    expect(queryByTestId(quotedMessageTextTestId)).toBeEmptyDOMElement();
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('should render quoted message text and attachments', async () => {
    const message = {
      quoted_message: {
        attachments: [generateFileAttachment({ testId: quotedAttachmentListTestId })],
        text: quotedText,
      },
    };
    const { container, queryByTestId, queryByText } = await renderQuotedMessage({
      customProps: { message },
    });
    expect(queryByTestId(quotedAttachmentListTestId)).toBeInTheDocument();
    expect(queryByText(quotedText)).toBeInTheDocument();
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('should render quoting message attachments', async () => {
    const message = {
      attachments: [generateFileAttachment({ testId: quotingAttachmentListTestId })],
      quoted_message: { text: quotedText },
    };
    const { container, queryByTestId } = await renderQuotedMessage({
      customProps: { message },
    });
    expect(queryByTestId(quotedAttachmentListTestId)).not.toBeInTheDocument();
    expect(queryByTestId(quotingAttachmentListTestId)).toBeInTheDocument();
    expect(queryByTestId(quotedMessageTextTestId)).toBeInTheDocument();
    expect(queryByTestId(quotedMessageContentsTestId).children).toHaveLength(1);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('should render avatar', async () => {
    const message = {
      quoted_message: { text: quotedText, user: alice },
    };
    const { container, queryByTestId } = await renderQuotedMessage({
      customProps: { message },
    });
    expect(queryByTestId(avatarTestId)).toBeInTheDocument();
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('should not render avatar if no user data', async () => {
    const message = {
      quoted_message: { text: quotedText },
    };
    const { container, queryByTestId } = await renderQuotedMessage({
      customProps: { message },
    });
    expect(queryByTestId(avatarTestId)).not.toBeInTheDocument();
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('renders quoted Poll component if message contains poll', async () => {
    const poll = generatePoll();
    const messageWithPoll = generateMessage({ poll, poll_id: poll.id, text: '' });
    const quotingMessage = generateMessage({
      quoted_message: messageWithPoll,
    });
    const {
      channels: [channel],
      client,
    } = await initClientWithChannels({
      channelsData: [{ messages: [messageWithPoll, quotingMessage] }],
      customUser: alice,
    });
    const { container } = await renderQuotedMessage({
      customChannel: channel,
      customClient: client,
      customProps: { message: quotingMessage },
    });
    const quotedPollPreview = container.querySelector(quotedPollPreviewClassSelector);
    expect(quotedPollPreview).toBeInTheDocument();
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('renders custom quoted Poll component if message contains poll', async () => {
    const poll = generatePoll();
    const messageWithPoll = generateMessage({ poll, poll_id: poll.id, text: '' });
    const quotingMessage = generateMessage({
      quoted_message: messageWithPoll,
    });
    const {
      channels: [channel],
      client,
    } = await initClientWithChannels({
      channelsData: [{ messages: [messageWithPoll, quotingMessage] }],
      customUser: alice,
    });
    const pollText = 'Custom Poll component';
    const QuotedPoll = () => <div>{pollText}</div>;

    await renderQuotedMessage({
      componentContext: { QuotedPoll },
      customChannel: channel,
      customClient: client,
      customProps: { message: quotingMessage },
    });
    expect(screen.getByText(pollText)).toBeInTheDocument();
  });

  describe('deleted', () => {
    it(`should render text "${deletedMessageText}" for type "deleted"`, async () => {
      const message = {
        quoted_message: { text: quotedText, type: 'deleted' },
      };
      const { container, queryByText } = await renderQuotedMessage({
        customProps: { message },
      });
      expect(queryByText(deletedMessageText)).toBeInTheDocument();
      expect(queryByText(quotedText)).not.toBeInTheDocument();
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it(`should not render quoted message attachments for type "deleted"`, async () => {
      const message = {
        quoted_message: {
          attachments: [generateFileAttachment({ testId: quotedAttachmentListTestId })],
          type: 'deleted',
        },
      };
      const { container, queryByTestId, queryByText } = await renderQuotedMessage({
        customProps: { message },
      });
      expect(queryByText(deletedMessageText)).toBeInTheDocument();
      expect(queryByTestId(quotedAttachmentListTestId)).not.toBeInTheDocument();
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it(`should not render quoting message attachments for type "deleted"`, async () => {
      const message = {
        attachments: [generateFileAttachment({ testId: quotingAttachmentListTestId })],
        quoted_message: {
          attachments: [generateFileAttachment({ testId: quotedAttachmentListTestId })],
          type: 'deleted',
        },
      };
      const { container, queryByTestId, queryByText } = await renderQuotedMessage({
        customProps: { message },
      });
      expect(queryByText(deletedMessageText)).toBeInTheDocument();
      expect(queryByTestId(quotingAttachmentListTestId)).toBeInTheDocument();
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it(`should render text "${deletedMessageText}" for deleted_at timestamp`, async () => {
      const message = {
        quoted_message: { deleted_at: new Date().toISOString(), text: quotedText },
      };
      const { container, queryByText } = await renderQuotedMessage({
        customProps: { message },
      });
      expect(queryByText(deletedMessageText)).toBeInTheDocument();
      expect(queryByText(quotedText)).not.toBeInTheDocument();
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it(`should not render quoted message attachments for deleted_at timestamp`, async () => {
      const message = {
        quoted_message: {
          attachments: [generateFileAttachment({ testId: quotedAttachmentListTestId })],
          deleted_at: new Date().toISOString(),
        },
      };
      const { container, queryByTestId, queryByText } = await renderQuotedMessage({
        customProps: { message },
      });
      expect(queryByText(deletedMessageText)).toBeInTheDocument();
      expect(queryByTestId(quotedAttachmentListTestId)).not.toBeInTheDocument();
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it(`should render quoting message attachments for deleted_at timestamp`, async () => {
      const message = {
        attachments: [generateFileAttachment({ testId: quotingAttachmentListTestId })],
        quoted_message: {
          attachments: [generateFileAttachment({ testId: quotedAttachmentListTestId })],
          deleted_at: new Date().toISOString(),
        },
      };
      const { container, queryByTestId, queryByText } = await renderQuotedMessage({
        customProps: { message },
      });
      expect(queryByText(deletedMessageText)).toBeInTheDocument();
      expect(queryByTestId(quotingAttachmentListTestId)).toBeInTheDocument();
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
  });
});
