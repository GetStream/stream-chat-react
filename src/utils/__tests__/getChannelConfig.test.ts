import { fromPartial } from '@total-typescript/shoehorn';
import type { Channel, ChannelConfigWithInfo } from 'stream-chat';
import { describe, expect, it, vi } from 'vitest';
import { getChannelConfig } from '../getChannelConfig';

const config = fromPartial<ChannelConfigWithInfo>({ read_events: true });

describe('getChannelConfig', () => {
  it('returns the channel config for a connected channel', () => {
    const channel = fromPartial<Channel>({
      disconnected: false,
      getConfig: () => config,
    });

    expect(getChannelConfig(channel)).toBe(config);
  });

  it('returns undefined for a disconnected channel without calling getConfig', () => {
    // channel.getConfig() calls channel.getClient(), which throws
    // "You can't use a channel after client.disconnect() was called"
    const getConfig = vi.fn(() => {
      throw new Error("You can't use a channel after client.disconnect() was called");
    });
    const channel = fromPartial<Channel>({ disconnected: true, getConfig });

    expect(getChannelConfig(channel)).toBeUndefined();
    expect(getConfig).not.toHaveBeenCalled();
  });
});
