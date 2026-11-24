import type { ReactElement } from 'react';
import type { SearchSource } from 'stream-chat';
import { fromPartial } from '@total-typescript/shoehorn';

import {
  ChannelDetailListLoadingIndicator,
  ChannelDetailListLoadingNextPageUI,
  ChannelFilesEmpty,
  ChannelFilesEmptyList,
  ChannelMediaEmpty,
  ChannelMediaEmptyList,
} from '..';

describe('deprecated 15.0 names of the channel detail list states', () => {
  it('ChannelDetailListLoadingIndicator renders ChannelDetailListLoadingNextPageUI with its props', () => {
    const searchSource = fromPartial<SearchSource>({});
    const element = ChannelDetailListLoadingIndicator({ searchSource }) as ReactElement;
    expect(element.type).toBe(ChannelDetailListLoadingNextPageUI);
    expect(element.props).toEqual({ searchSource });
  });

  it.each([
    ['ChannelFilesEmptyList', ChannelFilesEmptyList, ChannelFilesEmpty],
    ['ChannelMediaEmptyList', ChannelMediaEmptyList, ChannelMediaEmpty],
  ])('%s renders its new name', (_, deprecatedName, newName) => {
    expect((deprecatedName() as ReactElement).type).toBe(newName);
  });
});
