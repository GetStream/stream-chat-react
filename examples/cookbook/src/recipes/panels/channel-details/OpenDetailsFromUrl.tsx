import { findByText, useClickInTurn } from '../../../base/useClickInTurn';
import type { ClickStep } from '../../../base/useClickInTurn';

const details = new URLSearchParams(window.location.search).get('details');

const openDetails: ClickStep = {
  find: () => document.querySelector<HTMLElement>('.cookbook-channel-title-button'),
};
const pickMembers: ClickStep = {
  find: () =>
    findByText(
      '.cookbook-channel-details .str-chat__channel-detail__nav-button',
      'Members',
    ),
};
const steps: ClickStep[] =
  details === 'open'
    ? [openDetails]
    : details === 'members'
      ? [openDetails, pickMembers]
      : [];

/**
 * For the screenshots only, not part of the recipe: `?details=open` clicks the channel's title in
 * the header once it's on screen, and `?details=members` then picks the Members section. It never
 * clicks an action, so nothing is muted or left.
 */
export const OpenDetailsFromUrl = () => {
  useClickInTurn(steps);
  return null;
};
