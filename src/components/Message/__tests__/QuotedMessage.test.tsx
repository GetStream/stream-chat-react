import { fireEvent, render } from '@testing-library/react';
import React from 'react';
import { nanoid } from 'nanoid';
import { fromPartial } from '@total-typescript/shoehorn';
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
  generateUser,
  initClientWithChannels,
  mockChannelActionContext,
  mockChannelStateContext,
  mockChatContext,
  mockComponentContext,
  mockTranslationContextValue,
} from '../../../mock-builders';

import { Message } from '../Message';
import { MessageUI } from '../MessageUI';
import { QuotedMessage } from '../QuotedMessage';
import { renderText } from '../renderText';

vi.mock('../../ChatView', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../ChatView')>();
  return {
    ...actual,
    useChatViewContext: vi.fn(() => ({
      activeChatView: 'channels',
      setActiveChatView: vi.fn(),
    })),
    useThreadsViewContext: vi.fn(() => ({
      activeThread: undefined,
      setActiveThread: vi.fn(),
    })),
  };
});

const quotedMessagePreviewTestId = 'quoted-message-preview';
const quotedMessageTextTestId = 'quoted-message-text';
const quotedText = 'X';
const alice = generateUser({ name: 'alice' });
const jumpToMessageMock = vi.fn();

async function renderQuotedMessage({
  componentContext,
  customChannel,
  customClient,
  customProps,
}: any = {}) {
  const {
    channels: [channel],
    client,
  } = await initClientWithChannels({ customUser: alice });
  const channelConfig = (customChannel ?? channel).getConfig();
  const customDateTimeParser = vi.fn(() => ({ format: vi.fn() }));

  return render(
    <ChatProvider value={mockChatContext({ client: customClient ?? client })}>
      <ChannelStateProvider
        value={mockChannelStateContext({
          channel: customChannel ?? channel,
          channelConfig,
        })}
      >
        <ChannelActionProvider
          value={mockChannelActionContext({ jumpToMessage: jumpToMessageMock })}
        >
          <TranslationProvider
            value={mockTranslationContextValue({
              t: (key: any) => key,
              tDateTimeParser: customDateTimeParser,
              userLanguage: 'en',
            })}
          >
            <ComponentProvider
              value={mockComponentContext({
                Message: () => <MessageUI />,
                ...componentContext,
              })}
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
  beforeEach(() => {
    jumpToMessageMock.mockClear();
  });

  it('should not be rendered if no message.quoted_message', async () => {
    const { container, queryByTestId } = await renderQuotedMessage({
      customProps: { message: {} },
    });
    expect(queryByTestId(quotedMessagePreviewTestId)).not.toBeInTheDocument();
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
  it('should still render the preview with "Reply" text when quoted_message has no text or attachments', async () => {
    const message = { quoted_message: {} };
    const { container, queryByTestId, queryByText } = await renderQuotedMessage({
      customProps: { message },
    });
    expect(queryByTestId(quotedMessagePreviewTestId)).toBeInTheDocument();
    expect(queryByText('Reply')).toBeInTheDocument();
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('renders quoted message text', async () => {
    const messageText = 'hey @John Cena';
    const { container, findByTestId } = await renderQuotedMessage({
      customProps: {
        message: {
          quoted_message: {
            mentioned_users: [{ id: 'john', name: 'John Cena' }],
            text: messageText,
          },
        },
      },
    });

    const textEl = await findByTestId('quoted-message-text');
    expect(textEl.textContent).toContain(messageText);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('renders built-in, role, and user-group mentions inside quoted message text', async () => {
    const messageText = 'hey @channel @here @admin @Backend Team';
    const { container, findByText } = await renderQuotedMessage({
      customProps: {
        message: {
          quoted_message: {
            mentioned_channel: true,
            mentioned_groups: [
              fromPartial({
                created_at: '2026-05-28T00:00:00.000Z',
                id: 'backend-team',
                name: 'Backend Team',
                updated_at: '2026-05-28T00:00:00.000Z',
              }),
            ],
            mentioned_here: true,
            mentioned_roles: ['admin'],
            text: messageText,
          },
        },
        renderText,
      },
    });

    expect(await findByText('@channel')).toHaveAttribute('data-mention-type', 'channel');
    expect(await findByText('@here')).toHaveAttribute('data-mention-type', 'here');
    expect(await findByText('@admin')).toHaveAttribute('data-mention-type', 'role');
    expect(await findByText('@Backend Team')).toHaveAttribute(
      'data-mention-type',
      'user_group',
    );
    expect(container.querySelectorAll('.str-chat__message-mention')).toHaveLength(4);

    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('uses custom renderText fn if provided', async () => {
    const messageText = nanoid();
    const fn = vi
      .fn()
      .mockReturnValue(<div data-testid={messageText}>{messageText}</div>);

    const { container, findByTestId } = await renderQuotedMessage({
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
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('should render quoted message with file attachment indicator', async () => {
    const message = {
      quoted_message: {
        attachments: [generateFileAttachment()],
        text: '',
      },
    };
    const { container, queryByTestId } = await renderQuotedMessage({
      customProps: { message },
    });
    // The new QuotedMessagePreviewUI renders an icon for file attachments
    expect(queryByTestId(quotedMessagePreviewTestId)).toBeInTheDocument();
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('should render quoted message text and attachment indicator', async () => {
    const message = {
      quoted_message: {
        attachments: [generateFileAttachment()],
        text: quotedText,
      },
    };
    const { container, queryByTestId, queryByText } = await renderQuotedMessage({
      customProps: { message },
    });
    expect(queryByTestId(quotedMessagePreviewTestId)).toBeInTheDocument();
    expect(queryByText(quotedText)).toBeInTheDocument();
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('should render quoted message preview', async () => {
    const message = {
      quoted_message: { id: 'quoted-message-id', text: quotedText },
    };
    const { container, queryByTestId } = await renderQuotedMessage({
      customProps: { message },
    });
    expect(queryByTestId(quotedMessagePreviewTestId)).toBeInTheDocument();
    expect(queryByTestId(quotedMessageTextTestId)).toBeInTheDocument();
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('should apply keyboard button semantics when quoted message preview is interactive', async () => {
    const message = {
      quoted_message: { id: 'quoted-message-id', text: quotedText },
    };
    const { getByTestId } = await renderQuotedMessage({
      customProps: { message },
    });

    const quotedMessagePreview = getByTestId(quotedMessagePreviewTestId);
    expect(quotedMessagePreview).toHaveAttribute(
      'aria-label',
      'aria/Jump to quoted message',
    );
    expect(quotedMessagePreview).toHaveAttribute('role', 'button');
    expect(quotedMessagePreview).toHaveAttribute('tabindex', '0');
  });

  it('should jump to quoted message on Enter and Space, but not on other keys', async () => {
    const quotedMessageId = 'quoted-message-id';
    const message = {
      quoted_message: { id: quotedMessageId, text: quotedText },
    };
    const { getByTestId } = await renderQuotedMessage({
      customProps: { message },
    });

    const quotedMessagePreview = getByTestId(quotedMessagePreviewTestId);
    fireEvent.keyDown(quotedMessagePreview, { key: 'Backspace' });
    expect(jumpToMessageMock).not.toHaveBeenCalled();

    fireEvent.keyDown(quotedMessagePreview, { code: 'Enter', key: 'Enter' });
    fireEvent.keyDown(quotedMessagePreview, { code: 'Space', key: ' ' });

    expect(jumpToMessageMock).toHaveBeenCalledTimes(2);
    expect(jumpToMessageMock).toHaveBeenNthCalledWith(1, quotedMessageId);
    expect(jumpToMessageMock).toHaveBeenNthCalledWith(2, quotedMessageId);
  });

  it('should render author info when user data is provided', async () => {
    const message = {
      quoted_message: { text: quotedText, user: alice },
    };
    const { container, queryByText } = await renderQuotedMessage({
      customProps: { message },
    });
    // If the quoted message is from the current user, it renders "You"
    // If from another user, it renders "Reply to {{ authorName }}"
    const authorElement = queryByText('You') || queryByText(/Reply to/);
    expect(authorElement).toBeInTheDocument();
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('should render Reply text if no user data', async () => {
    const message = {
      quoted_message: { text: quotedText },
    };
    const { container, queryByText } = await renderQuotedMessage({
      customProps: { message },
    });
    expect(queryByText('Reply')).toBeInTheDocument();
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  describe('deleted', () => {
    it('should still render the quoted message preview for type "deleted"', async () => {
      const message = {
        quoted_message: { text: quotedText, type: 'deleted' },
      };
      const { container, queryByTestId } = await renderQuotedMessage({
        customProps: { message },
      });
      // The new QuotedMessagePreviewUI does not handle deleted state separately
      expect(queryByTestId(quotedMessagePreviewTestId)).toBeInTheDocument();
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should render the quoted message preview for type "deleted" with attachments', async () => {
      const message = {
        quoted_message: {
          attachments: [generateFileAttachment()],
          type: 'deleted',
        },
      };
      const { container, queryByTestId } = await renderQuotedMessage({
        customProps: { message },
      });
      expect(queryByTestId(quotedMessagePreviewTestId)).toBeInTheDocument();
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should still render the quoted message preview for deleted_at timestamp', async () => {
      const message = {
        quoted_message: { deleted_at: new Date().toISOString(), text: quotedText },
      };
      const { container, queryByTestId } = await renderQuotedMessage({
        customProps: { message },
      });
      expect(queryByTestId(quotedMessagePreviewTestId)).toBeInTheDocument();
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should render the quoted message preview for deleted_at with attachments', async () => {
      const message = {
        quoted_message: {
          attachments: [generateFileAttachment()],
          deleted_at: new Date().toISOString(),
        },
      };
      const { container, queryByTestId } = await renderQuotedMessage({
        customProps: { message },
      });
      expect(queryByTestId(quotedMessagePreviewTestId)).toBeInTheDocument();
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
  });
});
