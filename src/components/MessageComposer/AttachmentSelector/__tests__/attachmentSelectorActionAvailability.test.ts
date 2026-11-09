import { fromPartial } from '@total-typescript/shoehorn';
import type { MessageComposer } from 'stream-chat';
import {
  type AttachmentSelectorActionAvailabilityContext,
  isAttachmentSelectorActionAvailable,
} from '../attachmentSelectorActionAvailability';

const ActionButton = () => null;

const makeContext = (
  overrides: Partial<AttachmentSelectorActionAvailabilityContext> = {},
): AttachmentSelectorActionAvailabilityContext => ({
  attachmentsEnabled: true,
  availableCommands: [fromPartial({ name: 'giphy' })],
  channelCapabilities: new Set(['send-poll', 'upload-file']),
  customCdn: false,
  locationEnabled: true,
  messageComposer: fromPartial<MessageComposer>({ threadId: null }),
  pollsEnabled: true,
  ...overrides,
});

describe('isAttachmentSelectorActionAvailable', () => {
  it('offers every default action when everything is enabled', () => {
    const context = makeContext();
    for (const type of ['uploadFile', 'createPoll', 'addLocation', 'selectCommand']) {
      expect(isAttachmentSelectorActionAvailable({ ActionButton, type }, context)).toBe(
        true,
      );
    }
  });

  it.each([
    {
      context: {},
      expected: true,
      name: 'attachments are enabled and upload-file is granted',
    },
    {
      context: { channelCapabilities: new Set<string>(), customCdn: true },
      expected: true,
      name: 'files are stored outside Stream, without upload-file',
    },
    {
      context: { channelCapabilities: new Set<string>() },
      expected: false,
      name: 'files go to Stream without upload-file',
    },
    {
      context: { attachmentsEnabled: false, customCdn: true },
      expected: false,
      name: 'attachments are disabled',
    },
  ])('offers File: $expected when $name', ({ context, expected }) => {
    expect(
      isAttachmentSelectorActionAvailable(
        { ActionButton, type: 'uploadFile' },
        makeContext(context),
      ),
    ).toBe(expected);
  });

  it.each([
    { context: { pollsEnabled: false }, name: 'polls are disabled' },
    { context: { channelCapabilities: new Set<string>() }, name: 'send-poll is missing' },
    {
      context: { messageComposer: fromPartial<MessageComposer>({ threadId: 'thread' }) },
      name: 'the composer writes a thread reply',
    },
  ])('does not offer Poll when $name', ({ context }) => {
    expect(
      isAttachmentSelectorActionAvailable(
        { ActionButton, type: 'createPoll' },
        makeContext(context),
      ),
    ).toBe(false);
  });

  it.each([
    { context: { locationEnabled: false }, name: 'location sharing is disabled' },
    {
      context: { messageComposer: fromPartial<MessageComposer>({ threadId: 'thread' }) },
      name: 'the composer writes a thread reply',
    },
  ])('does not offer Location when $name', ({ context }) => {
    expect(
      isAttachmentSelectorActionAvailable(
        { ActionButton, type: 'addLocation' },
        makeContext(context),
      ),
    ).toBe(false);
  });

  it('does not offer Commands without a named command', () => {
    expect(
      isAttachmentSelectorActionAvailable(
        { ActionButton, type: 'selectCommand' },
        makeContext({ availableCommands: [fromPartial({ name: '' })] }),
      ),
    ).toBe(false);
  });

  it.each(['constructor', 'hasOwnProperty', 'toString'])(
    'offers a custom type named like an object member (%s)',
    (type) => {
      expect(
        isAttachmentSelectorActionAvailable({ ActionButton, type }, makeContext()),
      ).toBe(true);
    },
  );

  it('offers an action type it has no rule for', () => {
    expect(
      isAttachmentSelectorActionAvailable(
        { ActionButton, type: 'custom' },
        makeContext({
          attachmentsEnabled: false,
          locationEnabled: false,
          pollsEnabled: false,
        }),
      ),
    ).toBe(true);
  });
});
