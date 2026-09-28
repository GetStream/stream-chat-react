import React, { useContext } from 'react';
import { render, renderHook, screen } from '@testing-library/react';

import {
  MessageContext,
  useChannelInstanceContext,
  useChatContext,
  useComponentContext,
  useDialogManager,
  useMessageBounceContext,
  useMessageComposerContext,
  useMessageContext,
  useMessageListContext,
  useMessageTranslationViewContext,
  useModalContext,
  usePollContext,
  useTranslationContext,
  useVirtualizedMessageListContext,
} from '..';
import { useChannelListItemContext } from '../../components/ChannelListItem/ChannelListItem';
import { useContextMenuContext } from '../../components/Dialog/components/ContextMenu';
import { useGalleryContext } from '../../components/Gallery/GalleryContext';
import { useSearchContext } from '../../components/Search/SearchContext';
import { useSearchSourceResultsContext } from '../../components/Search/SearchSourceResultsContext';
import { useAriaLiveAnnouncer } from '../../components/Accessibility/useAriaLiveAnnouncer';
import { useChatViewContext } from '../../plugins/SlotLayout/ChatView';

/** Moving a hook between these two lists is an API change, not an accident. */
const REQUIRED_HOOKS: Array<[name: string, hook: () => unknown]> = [
  ['useChatContext', useChatContext],
  ['useMessageListContext', useMessageListContext],
  ['useVirtualizedMessageListContext', useVirtualizedMessageListContext],
  ['useMessageBounceContext', useMessageBounceContext],
  ['useMessageComposerContext', useMessageComposerContext],
  ['usePollContext', usePollContext],
  ['useDialogManager', () => useDialogManager()],
  ['useSearchContext', useSearchContext],
  ['useSearchSourceResultsContext', useSearchSourceResultsContext],
  ['useContextMenuContext', useContextMenuContext],
  ['useChannelListItemContext', useChannelListItemContext],
  ['useGalleryContext', useGalleryContext],
  ['useChatViewContext', useChatViewContext],
  ['useMessageContext', useMessageContext],
];

describe('context hooks outside their provider', () => {
  describe('required contexts throw and name themselves', () => {
    it.each(REQUIRED_HOOKS)('%s', (name, hook) => {
      expect(() => renderHook(() => hook())).toThrow(new RegExp(name));
    });
  });

  describe('contexts that are optional by design keep working', () => {
    it('useTranslationContext renders English copy outside <Chat>', () => {
      const Standalone = () => {
        const { t } = useTranslationContext();
        return <span>{t('common.you.label', 'You')}</span>;
      };

      render(<Standalone />);

      expect(screen.getByText('You')).toBeInTheDocument();
    });

    it('useComponentContext returns an empty override map', () => {
      const { result } = renderHook(() => useComponentContext());
      expect(result.current).toEqual({});
    });

    it('useChannelInstanceContext reports no channel in scope', () => {
      const { result } = renderHook(() => useChannelInstanceContext());
      expect(result.current.channel).toBeUndefined();
    });

    it('useModalContext returns a stable no-op close', () => {
      const { rerender, result } = renderHook(() => useModalContext());
      const first = result.current;
      rerender();

      expect(result.current).toBe(first);
      expect(() => result.current.close()).not.toThrow();
    });

    it('useAriaLiveAnnouncer returns a no-op announcer', () => {
      const { result } = renderHook(() => useAriaLiveAnnouncer());
      expect(() => result.current('hello')).not.toThrow();
    });

    it('useMessageTranslationViewContext returns its default view', () => {
      const { result } = renderHook(() => useMessageTranslationViewContext());
      expect(result.current.getTranslationView).toBeInstanceOf(Function);
    });

    it('MessageContext can still be read directly by components that render both inside and outside a message', () => {
      // the hook throws, the raw context does not
      const { result } = renderHook(() => useContext(MessageContext));
      expect(result.current).toBeUndefined();
    });
  });
});
