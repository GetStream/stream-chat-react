import { findByText, useClickInTurn } from '../../../base/useClickInTurn';

// `?lightbox=<n>` clicks the n-th tile of the four-photo grid, and `&in=<text>` picks the message
// with that text instead, so the shot shows the lightbox open at that item. Built once from the
// URL, as useClickInTurn needs.
const params = new URLSearchParams(window.location.search);
const tile = params.get('lightbox');
const messageText = params.get('in') ?? 'favourites from the trail';
const steps = tile
  ? [
      {
        find: () =>
          findByText('.str-chat__li', messageText)?.querySelectorAll<HTMLElement>(
            '.cookbook-image-grid__tile',
          )[Number(tile) - 1],
      },
    ]
  : [];

/** For the screenshots only, not part of the recipe: opens the lightbox from the URL. */
export const OpenLightboxFromUrl = () => {
  useClickInTurn(steps);
  return null;
};
