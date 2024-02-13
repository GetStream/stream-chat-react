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
          '--resize-ratio': 'var(--resize-ratio-x, var(--resize-ratio-y, 1))',
          '--resize-ratio-x': 'calc(var(--sprite-image-width) / var(--sprite-item-width))',
          '--resize-ratio-y': 'calc(var(--sprite-image-height) / var(--sprite-item-height))',
          '--sprite-item-height': `${spriteHeight / rows}`,
          '--sprite-item-width': `${spriteWidth / columns}`,
          ...(Number.isFinite(height) ? { '--sprite-image-height': `${height}px` } : {}),
          ...(Number.isFinite(width) ? { '--sprite-image-width': `${width}px` } : {}),
          backgroundImage: `url('${spriteUrl}')`,
          backgroundPosition: `${x * (100 / (columns - 1))}% ${y * (100 / (rows - 1))}%`,
          backgroundSize: `${columns * 100}% ${rows * 100}%`,
          height:
            'var(--sprite-image-height, calc(var(--sprite-item-height) * var(--resize-ratio)))',
          width: 'var(--sprite-image-width, calc(var(--sprite-item-width) * var(--resize-ratio)))',
        } as React.CSSProperties
      }
    />
  );
};
