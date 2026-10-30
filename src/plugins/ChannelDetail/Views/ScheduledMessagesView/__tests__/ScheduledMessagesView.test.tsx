import React from 'react';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import type { ScheduledMessageResponse } from 'stream-chat';

import { axe } from '../../../../../../axe-helper';
import {
  ChatProvider,
  ModalContextProvider,
  TranslationProvider,
} from '../../../../../context';
import { Streami18n } from '../../../../../i18n';
import {
  generateChannel,
  generateScheduledMessage,
  generateUser,
  initClientWithChannels,
  mockChatContext,
} from '../../../../../mock-builders';
import { defaultChannelDetailSections } from '../../../ChannelDetail';
import { ChannelDetailProvider } from '../../../ChannelDetailContext';
import { ScheduledMessagesView } from '../ScheduledMessagesView';

const cid = 'messaging:general';

const renderView = async (scheduledMessages: ScheduledMessageResponse[] = []) => {
  const {
    channels: [channel],
    client,
  } = await initClientWithChannels({
    channelsData: [generateChannel({ channel: { id: 'general', type: 'messaging' } })],
    customUser: generateUser({ id: 'user-id' }),
  });
  scheduledMessages.forEach(client.scheduledMessages.upsertToState);

  const close = vi.fn();
  const translators = await new Streami18n({ language: 'en' }).getTranslators();

  const view = render(
    <ChatProvider value={mockChatContext({ client })}>
      <TranslationProvider value={{ ...translators, userLanguage: 'en' }}>
        <ModalContextProvider value={{ close }}>
          <ChannelDetailProvider channel={channel}>
            <ScheduledMessagesView />
          </ChannelDetailProvider>
        </ModalContextProvider>
      </TranslationProvider>
    </ChatProvider>,
  );

  return { ...view, close };
};

describe('ScheduledMessagesView', () => {
  afterEach(() => {
    cleanup();
  });

  it('is one of the default channel detail sections', () => {
    const sectionIds = defaultChannelDetailSections.map(({ id }) => id);

    expect(sectionIds).toContain('scheduled-messages');
    expect(sectionIds.indexOf('scheduled-messages')).toBe(
      sectionIds.indexOf('pinned-messages') + 1,
    );
  });

  it('lists the scheduled messages of the channel', async () => {
    await renderView([
      generateScheduledMessage({ cid, message: { text: 'Launch moved to Monday' } }),
      generateScheduledMessage({
        cid: 'messaging:random',
        message: { text: 'Elsewhere' },
      }),
    ]);

    expect(screen.getByText('Scheduled messages')).toBeInTheDocument();
    expect(screen.getByText('Launch moved to Monday')).toBeInTheDocument();
    expect(screen.queryByText('Elsewhere')).not.toBeInTheDocument();
  });

  it('shows the empty state when nothing is scheduled', async () => {
    await renderView();

    expect(screen.getByText('No scheduled messages')).toBeInTheDocument();
  });

  it('closes the channel detail modal from the header', async () => {
    const { close } = await renderView();

    fireEvent.click(screen.getByRole('button', { name: 'Close' }));

    expect(close).toHaveBeenCalledTimes(1);
  });

  it('has no accessibility violations', async () => {
    const { container } = await renderView([generateScheduledMessage({ cid })]);

    expect(await axe(container)).toHaveNoViolations();
  });
});
