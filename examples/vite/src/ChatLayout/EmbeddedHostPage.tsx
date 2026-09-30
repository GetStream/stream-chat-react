import type { ReactNode } from 'react';

import { type AppSettingsState, useAppSettingsSelector } from '../AppSettings';

const pageLayoutSelector = ({ pageLayout }: AppSettingsState) => ({
  embedded: pageLayout.embedded,
});

/**
 * With the "Embedded in page" layout setting, renders the chat as a fixed-height widget
 * between host-page content taller than the viewport, so the window scrolls as well.
 * Any scroll the chat performs on an ancestor (e.g. Element.scrollIntoView) then shows up
 * as the host page moving.
 *
 * The chat wrapper stays mounted in both layouts (it is `display: contents` in the full
 * viewport one), so toggling the setting does not remount the chat.
 */
export const EmbeddedHostPage = ({ children }: { children: ReactNode }) => {
  const { embedded } = useAppSettingsSelector(pageLayoutSelector);

  return (
    <>
      {embedded && (
        <header className='app-embedded-host__content'>
          <strong>Host page header</strong>
          <p>
            The chat below is embedded in a page that scrolls. Scrolling inside the chat
            should never move this page. Scroll the page so the chat is only partly in
            view, then e.g. jump to the first unread message and check that the page stays
            where it was.
          </p>
        </header>
      )}
      <div className='app-embedded-host__chat'>{children}</div>
      {embedded && (
        <footer className='app-embedded-host__content'>
          <strong>Host page footer</strong>
        </footer>
      )}
    </>
  );
};
