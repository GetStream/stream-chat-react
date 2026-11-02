import { useEffect } from 'react';
import { useChatContext } from 'stream-chat-react';

/**
 * `?simulate=search&q=<text>` runs a search for `text` once the app loads, as if the user had
 * typed it into the search bar, for the screenshots of search results.
 */
export const SimulateSearch = () => {
  const { searchController } = useChatContext();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const query = params.get('q');
    // StrictMode runs effects twice; one search is enough.
    if (params.get('simulate') !== 'search' || !query) return;
    if (searchController.searchQuery === query) return;
    searchController.activate();
    void searchController.search(query);
  }, [searchController]);

  return null;
};
