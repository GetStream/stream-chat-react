import { findByText, useClickInTurn } from '../../../base/useClickInTurn';
import type { ClickStep } from '../../../base/useClickInTurn';
import { LOCAL_POLL_MESSAGE_ID } from './ShowPollLocally';

const openMenu: ClickStep = {
  find: () =>
    document.querySelector<HTMLElement>(
      `[data-message-id='${LOCAL_POLL_MESSAGE_ID}'] [data-testid='message-actions-toggle-button']`,
    ),
};

const pickEditPoll: ClickStep = {
  find: () => findByText('.str-chat__message-actions-box--open button', 'Edit poll'),
};

// Scrolls the dialog to its settings. The click on the dialog's body that follows does nothing.
const scrollToSettings: ClickStep = {
  find: () => {
    const body = document.querySelector<HTMLElement>(
      '.cookbook-edit-poll .str-chat__prompt__body',
    );
    body?.scrollTo({ top: body.scrollHeight });
    return body;
  },
};

// Sunday has a vote, so its remove button asks for confirmation.
const removeVotedOption: ClickStep = {
  find: () =>
    document.querySelector<HTMLElement>(
      ".cookbook-edit-poll button[aria-label='Remove option: Sunday']",
    ),
};

const stepsByValue: Record<string, ClickStep[]> = {
  dialog: [openMenu, pickEditPoll],
  menu: [openMenu],
  remove: [openMenu, pickEditPoll, removeVotedOption],
  settings: [openMenu, pickEditPoll, scrollToSettings],
};

// Built once from the URL, so useClickInTurn gets the same array on every render.
const steps =
  stepsByValue[new URLSearchParams(window.location.search).get('editPoll') ?? ''] ?? [];

/**
 * For the screenshots only, not part of the recipe: `?editPoll=menu` opens the local poll
 * message's actions menu, `?editPoll=dialog` then picks Edit poll, as a user would,
 * `?editPoll=remove` also presses Sunday's remove button, and `?editPoll=settings` scrolls the
 * dialog to its settings instead.
 */
export const OpenEditPollFromUrl = () => {
  useClickInTurn(steps);
  return null;
};
