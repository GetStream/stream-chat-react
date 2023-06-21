import '@testing-library/jest-dom';
import { render } from '@testing-library/react';
import { toHaveNoViolations } from 'jest-axe';
import React from 'react';
import { axe } from '../../../../axe-helper';

import {
  ChannelActionProvider,
  ChannelStateProvider,
  ChatProvider,
  ComponentProvider,
  TranslationProvider,
} from '../../../context';
import {
  generateChannel,
  generateFileAttachment,
  generateUser,
  getTestClientWithUser,
} from '../../../mock-builders';

import { Message } from '../Message';
import { MessageSimple } from '../MessageSimple';
import { QuotedMessage } from '../QuotedMessage';

expect.extend(toHaveNoViolations);

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

async function renderQuotedMessage(customProps, channelConfigOverrides = {}, renderer = render) {
  const client = await getTestClientWithUser(alice);
  const channel = generateChannel({
    getConfig: () => ({ reactions: true, ...channelConfigOverrides }),
    state: { membership: {} },
  });
  const channelConfig = channel.getConfig();
  const customDateTimeParser = jest.fn(() => ({ format: jest.fn() }));

  return renderer(
    <ChatProvider value={{ client }}>
      <ChannelStateProvider value={{ channel, channelConfig }}>
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
                // eslint-disable-next-line react/display-name
                Message: () => <MessageSimple channelConfig={channelConfig} />,
              }}
            >
              <Message {...customProps}>
                <QuotedMessage {...customProps} />
              </Message>
            </ComponentProvider>
          </TranslationProvider>
        </ChannelActionProvider>
      </ChannelStateProvider>
    </ChatProvider>,
  );
}

describe('QuotedMessage', () => {
  it('should not be rendered if no message.quoted_message', async () => {
    const { container, queryByTestId } = await renderQuotedMessage({ message: {} });
    expect(queryByTestId(quotedMessageTestId)).not.toBeInTheDocument();
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
  it('should not be rendered if no text neither attachments', async () => {
    const message = { quoted_message: {} };
    const { container, queryByTestId } = await renderQuotedMessage({ message });
    expect(queryByTestId(quotedMessageTestId)).not.toBeInTheDocument();
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('should rendered text', async () => {
    const { container, queryByTestId, queryByText } = await renderQuotedMessage({
      message: { quoted_message: { text: quotedText } },
    });
    expect(queryByText(quotedText)).toBeInTheDocument();
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
    const { container, queryByTestId } = await renderQuotedMessage({ message });
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
    const { container, queryByTestId, queryByText } = await renderQuotedMessage({ message });
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
    const { container, queryByTestId } = await renderQuotedMessage({ message });
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
    const { container, queryByTestId } = await renderQuotedMessage({ message });
    expect(queryByTestId(avatarTestId)).toBeInTheDocument();
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('should not render avatar if no user data', async () => {
    const message = {
      quoted_message: { text: quotedText },
    };
    const { container, queryByTestId } = await renderQuotedMessage({ message });
    expect(queryByTestId(avatarTestId)).not.toBeInTheDocument();
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  describe('deleted', () => {
    it(`should render text "${deletedMessageText}" for type "deleted"`, async () => {
      const message = {
        quoted_message: { text: quotedText, type: 'deleted' },
      };
      const { container, queryByText } = await renderQuotedMessage({ message });
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
      const { container, queryByTestId, queryByText } = await renderQuotedMessage({ message });
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
      const { container, queryByTestId, queryByText } = await renderQuotedMessage({ message });
      expect(queryByText(deletedMessageText)).toBeInTheDocument();
      expect(queryByTestId(quotingAttachmentListTestId)).toBeInTheDocument();
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it(`should render text "${deletedMessageText}" for deleted_at timestamp`, async () => {
      const message = {
        quoted_message: { deleted_at: new Date().toISOString(), text: quotedText },
      };
      const { container, queryByText } = await renderQuotedMessage({ message });
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
      const { container, queryByTestId, queryByText } = await renderQuotedMessage({ message });
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
      const { container, queryByTestId, queryByText } = await renderQuotedMessage({ message });
      expect(queryByText(deletedMessageText)).toBeInTheDocument();
      expect(queryByTestId(quotingAttachmentListTestId)).toBeInTheDocument();
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
  });
});
