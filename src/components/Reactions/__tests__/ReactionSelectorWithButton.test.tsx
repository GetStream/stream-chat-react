import React from 'react';
import { cleanup, render } from '@testing-library/react';

import { ReactionSelectorWithButton } from '../ReactionSelectorWithButton';
import { ReactionSelector } from '../ReactionSelector';

// Regression guard (#3): the reaction dialog id used by ReactionSelectorWithButton MUST
// equal the id MessageActions derives via `ReactionSelector.getDialogId`. MessageActions
// uses that id to keep `.str-chat__message-options--active` applied while the reaction
// dialog is open; if the ids diverge, the options (and the trigger button) hide when
// focus moves into the portaled dialog, the reference collapses, and the popover falls
// back to the 8,8 corner. This test fails if the two derivations drift apart again.

const capturedDialogIds: string[] = [];

vi.mock('../../../context', () => ({
  useComponentContext: () => ({}),
  useMessageContext: () => ({
    isMyMessage: () => false,
    message: { id: 'message-1' },
    threadList: false,
  }),
  useTranslationContext: () => ({
    t: (key: string, second?: unknown, third?: unknown) => {
      const defaultValue = typeof second === 'string' ? second : undefined;
      const options = ((typeof second === 'object' ? second : third) ?? {}) as Record<
        string,
        unknown
      >;
      let template = defaultValue;
      if (template === undefined && typeof options.count === 'number') {
        template = (
          options.count === 1 ? options.defaultValue_one : options.defaultValue_other
        ) as string | undefined;
      }
      template ??= options.defaultValue as string | undefined;
      template ??= key;
      return template.replace(/\{\{\s*([\w.]+)\s*\}\}/g, (whole, name: string) => {
        const value = options[name];
        return value === undefined || value === null ? whole : String(value);
      });
    },
  }),
}));

vi.mock('../../Dialog', () => ({
  DialogAnchor: () => null,
  useDialogIsOpen: () => false,
  useDialogOnNearestManager: ({ id }: { id: string }) => {
    capturedDialogIds.push(id);
    return { dialog: undefined, dialogManager: undefined };
  },
}));

vi.mock('../../MessageActions', () => ({
  QuickMessageActionsButton: () => null,
}));

afterEach(cleanup);

describe('ReactionSelectorWithButton', () => {
  it('opens the dialog under the same id MessageActions derives via getDialogId', () => {
    capturedDialogIds.length = 0;
    render(<ReactionSelectorWithButton ReactionIcon={() => null} />);

    const expectedId = ReactionSelector.getDialogId({
      messageId: 'message-1',
      threadList: false,
    });

    expect(capturedDialogIds).toContain(expectedId);
  });
});
