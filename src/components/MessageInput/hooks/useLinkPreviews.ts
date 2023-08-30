import { find } from 'linkifyjs';
import { Dispatch, useCallback, useEffect, useState } from 'react';
import debounce from 'lodash.debounce';
import { useChannelStateContext, useChatContext } from '../../../context';
import type { MessageInputReducerAction, MessageInputState } from './useMessageInputState';
import type { DefaultStreamChatGenerics } from '../../../types/types';
import type { LinkPreview, LinkPreviewMap } from '../types';
import { LinkPreviewState, SetLinkPreviewMode } from '../types';
import type { DebouncedFunc } from 'lodash';

export type URLEnrichmentConfig = {
  /** Number of milliseconds to debounce firing the URL enrichment queries when typing. The default value is 1500(ms). */
  debounceURLEnrichmentMs?: number;
  /** Allows for toggling the URL enrichment and link previews in `MessageInput`. By default, the feature is disabled. */
  enrichURLForPreview?: boolean;
  /** Custom function to identify URLs in a string and request OG data */
  findURLFn?: (text: string) => string[];
  /** Custom function to handle link preview dismissal */
  onPreviewDismissed?: (
    linkPreview: LinkPreview,
    setEnrichURLEnabled: Dispatch<React.SetStateAction<boolean>>,
  ) => void;
};

type UseEnrichURLsParams<
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics
> = URLEnrichmentConfig & {
  dispatch: Dispatch<MessageInputReducerAction<StreamChatGenerics>>;
  linkPreviews: MessageInputState<StreamChatGenerics>['linkPreviews'];
};

export type EnrichURLsController = {
  /** Function called when a single link preview is dismissed. */
  dismissLinkPreview: (linkPreview: LinkPreview) => void;
  /** Function that triggers the search for URLs and their enrichment. */
  findAndEnqueueURLsToEnrich?: DebouncedFunc<(text: string, mode?: SetLinkPreviewMode) => void>;
};

export const useLinkPreviews = <
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics
>({
  debounceURLEnrichmentMs = 1500,
  dispatch,
  enrichURLForPreview = false,
  findURLFn,
  linkPreviews,
  onPreviewDismissed,
}: UseEnrichURLsParams<StreamChatGenerics>): EnrichURLsController => {
  const { client } = useChatContext();
  // FIXME: the value of channelConfig is stale due to omitting it from the memoization deps in useCreateChannelStateContext
  const { channelConfig } = useChannelStateContext();
  const [enrichURLsEnabled, setEnrichURLsEnabled] = useState(enrichURLForPreview);

  const dismissLinkPreview = useCallback(
    (linkPreview: LinkPreview) => {
      onPreviewDismissed?.(linkPreview, setEnrichURLsEnabled);
      const previewToRemoveMap = new Map();
      linkPreview.state = LinkPreviewState.DISMISSED;
      previewToRemoveMap.set(linkPreview.og_scrape_url, linkPreview);
      dispatch({
        linkPreviews: previewToRemoveMap,
        mode: SetLinkPreviewMode.UPSERT,
        type: 'setLinkPreviews',
      });
    },
    [onPreviewDismissed],
  );

  const findAndEnqueueURLsToEnrich = useCallback(
    debounce(
      (text: string, mode = SetLinkPreviewMode.SET) => {
        const urls = findURLFn
          ? findURLFn(text)
          : find(text, 'url').reduce<string[]>((acc, link) => {
              if (link.isLink) acc.push(link.href);
              return acc;
            }, []);

        dispatch({
          linkPreviews: urls.reduce<LinkPreviewMap>((acc, url) => {
            acc.set(url, { og_scrape_url: url, state: LinkPreviewState.QUEUED });
            return acc;
          }, new Map()),
          mode,
          type: 'setLinkPreviews',
        });
      },
      debounceURLEnrichmentMs,
      { leading: false, trailing: true },
    ),
    [debounceURLEnrichmentMs, findURLFn],
  );

  useEffect(() => {
    const enqueuedLinks = Array.from(linkPreviews.values()).reduce<LinkPreviewMap>(
      (acc, linkPreview) => {
        if (linkPreview.state === 'queued') {
          const loadingLinkPreview: LinkPreview = {
            ...linkPreview,
            state: LinkPreviewState.LOADING,
          };
          acc.set(linkPreview.og_scrape_url, loadingLinkPreview);
        }
        return acc;
      },
      new Map(),
    );

    if (!enqueuedLinks.size) return;

    dispatch({
      linkPreviews: enqueuedLinks,
      mode: SetLinkPreviewMode.UPSERT,
      type: 'setLinkPreviews',
    });

    enqueuedLinks.forEach((linkPreview) => {
      client
        .enrichURL(linkPreview.og_scrape_url)
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        .then(({ duration, ...ogAttachment }) => {
          const linkPreviewsMap = new Map();
          linkPreviewsMap.set(linkPreview.og_scrape_url, {
            ...ogAttachment,
            state: LinkPreviewState.LOADED,
          });
          dispatch({
            linkPreviews: linkPreviewsMap,
            mode: SetLinkPreviewMode.UPSERT,
            type: 'setLinkPreviews',
          });
        })
        .catch(() => {
          const linkPreviewsMap = new Map();
          linkPreviewsMap.set(linkPreview.og_scrape_url, {
            ...linkPreview,
            state: LinkPreviewState.FAILED,
          });
          dispatch({
            linkPreviews: linkPreviewsMap,
            mode: SetLinkPreviewMode.UPSERT,
            type: 'setLinkPreviews',
          });
        });
    });
  }, [linkPreviews]);

  return {
    dismissLinkPreview,
    findAndEnqueueURLsToEnrich:
      channelConfig?.url_enrichment && enrichURLsEnabled ? findAndEnqueueURLsToEnrich : undefined,
  };
};
