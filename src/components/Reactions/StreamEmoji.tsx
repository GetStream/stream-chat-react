import React from 'react';

import { SpriteImage, SpriteImageProps } from './SpriteImage';

import type { Readable } from '../../types/types';

const StreamSpriteEmojiPositions = {
  angry: [1, 1],
  haha: [1, 0],
  like: [0, 0],
  love: [1, 2],
  sad: [0, 1],
  wow: [0, 2],
};

type StreamEmojiType = keyof typeof StreamSpriteEmojiPositions;

const STREAM_SPRITE_URL = 'https://getstream.imgix.net/images/emoji-sprite.png';

export const StreamEmoji = ({
  fallback,
  type,
}: Readable<{ type: StreamEmojiType } & Pick<SpriteImageProps, 'fallback'>>) => {
  const position = StreamSpriteEmojiPositions[type] as [number, number];
  return (
    <SpriteImage
      columns={2}
      fallback={fallback}
      height={18}
      position={position}
      rows={3}
      spriteUrl={STREAM_SPRITE_URL}
    />
  );
};
