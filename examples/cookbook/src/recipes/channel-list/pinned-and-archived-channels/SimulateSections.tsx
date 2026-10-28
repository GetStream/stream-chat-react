import { useEffect } from 'react';
import type { ClickStep } from '../../../base/useClickInTurn';
import { findByText, useClickInTurn } from '../../../base/useClickInTurn';

const params = new URLSearchParams(window.location.search);
const simulate = params.get('simulate');
const rowTitle = params.get('row');
const opensArchive = simulate === 'archive' || simulate === 'archive-more';

const openArchive: ClickStep = {
  find: () =>
    document.querySelector<HTMLElement>(
      '.cookbook-channel-section__toggle[aria-expanded="false"]',
    ),
};
const loadMoreArchived: ClickStep = {
  find: () =>
    document.querySelector<HTMLElement>(
      '.cookbook-channel-section:has([aria-expanded="true"]) .cookbook-channel-section__more button',
    ),
};

const archiveSteps: ClickStep[] =
  simulate === 'archive-more'
    ? [openArchive, loadMoreArchived]
    : opensArchive
      ? [openArchive]
      : [];

/**
 * For the screenshots: `?simulate=archive` opens the Archived section, `?simulate=archive-more`
 * also clicks its "Load more", and both keep the end of the archive in view while its rows load.
 * `?simulate=row-menu&row=<channel name>` opens that row's action menu, as a click would. The menu
 * is opened again whenever it isn't open, since the sections re-render their rows while they load.
 */
export const SimulateSections = () => {
  useClickInTurn(archiveSteps);

  useEffect(() => {
    if (!opensArchive) return;
    const timer = setInterval(() => {
      document
        .querySelector('.cookbook-channel-section__toggle[aria-expanded="true"]')
        ?.closest('section')
        ?.scrollIntoView({ block: 'end' });
    }, 300);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (simulate !== 'row-menu' || !rowTitle) return;
    const timer = setInterval(() => {
      const toggle = findByText(
        '.str-chat__channel-list-item-container',
        rowTitle,
      )?.querySelector<HTMLElement>('[data-testid="channel-list-item-dropdown-toggle"]');
      if (toggle && toggle.getAttribute('aria-expanded') !== 'true') toggle.click();
    }, 300);
    return () => clearInterval(timer);
  }, []);

  return null;
};
