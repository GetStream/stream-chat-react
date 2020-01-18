import * as React from 'react';

declare module 'react-file-utils' {
  interface CarouselProps {
    mimeType: string;
    filename?: string;
    big: boolean;
    size: number;
  }

  export class FileIcon extends React.Component<CarouselProps> {}
}
