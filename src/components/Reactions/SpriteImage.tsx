import React, { useEffect, useState } from 'react';

import { getImageDimensions } from './utils/utils';

export type SpriteImageProps = {
  columns: number;
  position: [number, number];
  rows: number;
  spriteUrl: string;
  fallback?: React.ReactNode;
  height?: number;
  style?: React.CSSProperties;
  width?: number;
};

export const SpriteImage = ({
  columns,
  fallback,
  height,
  position,
  rows,
  spriteUrl,
  style,
  width,
}: SpriteImageProps) => {
  const [[spriteWidth, spriteHeight], setSpriteDimensions] = useState([0, 0]);

  useEffect(() => {
    getImageDimensions(spriteUrl).then(setSpriteDimensions).catch(console.error);
  }, [spriteUrl]);

  const [x, y] = position;

  if (!spriteHeight || !spriteWidth) return <>{fallback}</>;

  return (
    <div
      data-testid='sprite-image'
      style={
        {
          ...style,
          '--str-chat__sprite-image-resize-ratio':
            'var(--str-chat__sprite-image-resize-ratio-x, var(--str-chat__sprite-image-resize-ratio-y, 1))',
          '--str-chat__sprite-image-resize-ratio-x':
            'calc(var(--str-chat__sprite-image-width) / var(--str-chat__sprite-item-width))',
          '--str-chat__sprite-image-resize-ratio-y':
            'calc(var(--str-chat__sprite-image-height) / var(--str-chat__sprite-item-height))',
          '--str-chat__sprite-item-height': `${spriteHeight / rows}`,
          '--str-chat__sprite-item-width': `${spriteWidth / columns}`,
          ...(Number.isFinite(height)
            ? { '--str-chat__sprite-image-height': `${height}px` }
            : {}),
          ...(Number.isFinite(width)
            ? { '--str-chat__sprite-image-width': `${width}px` }
            : {}),
          backgroundImage: `url('${spriteUrl}')`,
          backgroundPosition: `${x * (100 / (columns - 1))}% ${y * (100 / (rows - 1))}%`,
          backgroundSize: `${columns * 100}% ${rows * 100}%`,
          height:
            'var(--str-chat__sprite-image-height, calc(var(--str-chat__sprite-item-height) * var(--str-chat__sprite-image-resize-ratio)))',
          width:
            'var(--str-chat__sprite-image-width, calc(var(--str-chat__sprite-item-width) * var(--str-chat__sprite-image-resize-ratio)))',
        } as React.CSSProperties
      }
    />
  );
};
