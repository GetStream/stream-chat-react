import React, { useEffect, useState } from 'react';

import { getImageDimensions } from './utils/utils';

export type SpriteImageProps = {
  columns: number;
  position: [number, number];
  rows: number;
  spriteUrl: string;
  fallback?: React.ReactNode;
  height?: number;
  width?: number;
};

export const SpriteImage = ({
  columns,
  fallback,
  height,
  position,
  rows,
  spriteUrl,
  width,
}: SpriteImageProps) => {
  const [[spriteWidth, spriteHeight], setSpriteDimensions] = useState([0, 0]);

  useEffect(() => {
    getImageDimensions(spriteUrl).then(setSpriteDimensions).catch(console.error);
  }, [spriteUrl]);

  const [x, y] = position;
  const spriteItemWidth = spriteWidth / columns;
  const spriteItemHeight = spriteHeight / rows;

  let resizeRatio = 1;

  if (!width && height) resizeRatio = height / spriteItemHeight;
  if (width && !height) resizeRatio = width / spriteItemWidth;

  if (resizeRatio === Infinity) resizeRatio = 1;

  if (!spriteHeight || !spriteWidth) return <>{fallback}</>;

  return (
    <div
      data-testid='sprite-image'
      style={{
        backgroundImage: `url('${spriteUrl}')`,
        backgroundPosition: `${x * (100 / (columns - 1))}% ${y * (100 / (rows - 1))}%`,
        backgroundSize: `${columns * 100}% ${rows * 100}%`,
        height: height ?? spriteItemHeight * resizeRatio,
        width: width ?? spriteItemWidth * resizeRatio,
      }}
    />
  );
};
