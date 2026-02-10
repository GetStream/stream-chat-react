# Gallery Component Specification

## Overview

The Gallery component renders images and videos in a carousel format. It is a pure content component that can be rendered standalone (inline) or wrapped in a `Modal` component for fullscreen display. The Gallery does not handle modal logic itself—that responsibility belongs to `src/components/Modal/`.

## Architecture

The Gallery system consists of three main parts:

1. **`Gallery`** (Provider Component): The carousel component that manages state and exposes the gallery controls API through `GalleryContext`
2. **`GalleryUI`** (UI Component): Renders the carousel interface based on context state. This component is replaceable via props for full UI customization.
3. **`ModalGallery`** (Composition Component): Renders a grid of image/video thumbnails that, when clicked, opens a `Modal` containing the `Gallery` carousel.

```
┌─────────────────────────────────────────────────────┐
│ ModalGallery                                        │
│ - Renders thumbnail grid                            │
│ - Manages modal open/close state                    │
│ - Opens Modal + Gallery on thumbnail click          │
│                                                     │
│  ┌───────────────────────────────────────────────┐  │
│  │ Modal (when open)                             │  │
│  │  ┌─────────────────────────────────────────┐  │  │
│  │  │ Gallery (Provider)                      │  │  │
│  │  │ - Manages items, currentIndex           │  │  │
│  │  │ - Provides GalleryContext               │  │  │
│  │  │                                         │  │  │
│  │  │  ┌───────────────────────────────────┐  │  │  │
│  │  │  │ GalleryUI (Replaceable)           │  │  │  │
│  │  │  │ - Consumes GalleryContext         │  │  │  │
│  │  │  │ - Renders media & navigation      │  │  │  │
│  │  │  │ - Uses BaseImage for images       │  │  │  │
│  │  │  └───────────────────────────────────┘  │  │  │
│  │  └─────────────────────────────────────────┘  │  │
│  └───────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────┘
```

## Input Types

The component accepts an array of media items of the following types (imported from `stream-chat`):

```typescript
type GalleryItem = LocalVideoAttachment | LocalImageAttachment;

interface GalleryProps {
  /** Array of media attachments to display */
  items: GalleryItem[];
  /** Initial index of the item to display (default: 0) */
  initialIndex?: number;
  /** Callback when the active item changes */
  onIndexChange?: (index: number) => void;
  /** Custom UI component to replace the default GalleryUI */
  GalleryUI?: React.ComponentType;
}

interface ModalGalleryProps {
  /** Array of media attachments to display */
  items: GalleryItem[];
}
```

### LocalImageAttachment

Contains properties such as:

- `image_url`: URL of the full-size image
- `thumb_url`: URL of the thumbnail image
- `fallback`: Alt text for the image
- `localMetadata.previewUri`: Local preview URI before upload completes

### LocalVideoAttachment

Contains properties such as:

- `asset_url`: URL of the video file
- `thumb_url`: URL of the video thumbnail
- `title`: Title/name of the video
- `duration`: Duration of the video
- `localMetadata.previewUri`: Local preview URI before upload completes

## GalleryContext API

The `Gallery` component provides the following API through `GalleryContext`:

```typescript
interface GalleryContextValue {
  /** All items in the gallery */
  items: GalleryItem[];
  /** Currently displayed item index */
  currentIndex: number;
  /** Currently displayed item */
  currentItem: GalleryItem;
  /** Total number of items */
  itemCount: number;
  /** Navigate to a specific index */
  goToIndex: (index: number) => void;
  /** Navigate to the next item */
  goToNext: () => void;
  /** Navigate to the previous item */
  goToPrevious: () => void;
  /** Whether there is a next item */
  hasNext: boolean;
  /** Whether there is a previous item */
  hasPrevious: boolean;
}
```

Consumers can access the context via the `useGalleryContext` hook.

## Display Modes

### ModalGallery (Recommended for Modal Usage)

Use `ModalGallery` to display a thumbnail grid that opens the carousel in a modal when clicked:

```tsx
<ModalGallery items={attachments} />
```

This handles the thumbnail grid rendering, modal state, and composes `Modal` + `Gallery` internally.

### Gallery Inline

The `Gallery` component itself is display-mode agnostic and can be rendered directly within any container:

```tsx
<div className='carousel-container'>
  <Gallery items={attachments} />
</div>
```

### Gallery in Modal (Manual Composition)

For custom modal behavior, wrap `Gallery` with the `Modal` component from `src/components/Modal/`:

```tsx
<Modal open={isOpen} onClose={handleClose} className='str-chat__gallery-modal'>
  <Gallery items={attachments} initialIndex={selectedIndex} />
</Modal>
```

The Modal component handles:

- Fullscreen overlay with backdrop
- Close button (top-right corner)
- Escape key to close
- Click outside to close
- Focus trapping via `FocusScope`

## UI Components

### Main Display Area

- Shows the currently selected media item at full size
- For images: uses `BaseImage` component (`src/components/Gallery/BaseImage.tsx`) with zoom capability
- For videos: displays a play icon overlay on the thumbnail, which when clicked renders a video player with standard controls (play/pause, seek, volume, fullscreen)
- Maintains aspect ratio of the media
- Supports pinch-to-zoom and pan gestures on touch devices
- Supports full-screen mode

### Navigation Controls

- Left/right arrow buttons for navigating between items
- Arrows hidden when at the first/last item respectively
- Supports keyboard navigation (left/right arrow keys)
- Supports swipe gestures on touch devices
- Displays current position indicator (e.g., "3 / 10")

## Behavior

### Loading States

- Shows a loading spinner while media is loading
- Displays thumbnail immediately if available
- Progressively loads full-resolution content
- For uploads in progress, shows upload progress indicator

### Error Handling

- `BaseImage` handles image load errors with fallback UI and download button
- Displays fallback UI if media fails to load
- Shows retry button for failed loads

### Video Playback

- Autoplay is disabled by default
- Video pauses when navigating to another item
- Remembers playback position when navigating away and back
- Supports native video controls

## Accessibility

- Full keyboard navigation support (left/right arrows)
- ARIA labels for all interactive elements
- Screen reader announcements for navigation
- Respects `prefers-reduced-motion` for animations

## File Structure

```
src/components/Gallery/
├── Gallery.tsx              # Provider component with GalleryContext (carousel)
├── GalleryUI.tsx            # Default UI component (replaceable)
├── GalleryContext.tsx       # Context definition and useGalleryContext hook
├── ModalGallery.tsx         # Thumbnail grid that opens Gallery in a Modal
├── BaseImage.tsx            # Image component with error handling
├── Image.tsx                # Legacy image component
├── index.tsx                # Public exports
├── gallery-spec.md          # This specification
├── styling/
│   └── index.scss           # Gallery styles (imported by src/styling/index.scss)
└── __tests__/
    └── ...
```

### Removed Dependencies

- `react-image-gallery` package is no longer used

The `styling/index.scss` is imported by `src/styling/index.scss`:

```scss
// In src/styling/index.scss
@use '../components/Gallery/styling' as Gallery;
```

## CSS Class Structure

### ModalGallery (Thumbnail Grid)

```
.str-chat__modal-gallery
  .str-chat__modal-gallery--two-images
  .str-chat__modal-gallery--three-images
  .str-chat__modal-gallery__image
  .str-chat__modal-gallery__placeholder
```

### Gallery (Carousel)

```
.str-chat__gallery
  .str-chat__gallery__container
  .str-chat__gallery__main
    .str-chat__gallery__media
    .str-chat__gallery__media--image
    .str-chat__gallery__media--video
    .str-chat__gallery__loading
    .str-chat__gallery__error
  .str-chat__gallery__navigation
    .str-chat__gallery__nav-button
    .str-chat__gallery__nav-button--prev
    .str-chat__gallery__nav-button--next
    .str-chat__gallery__position-indicator
```

## Component Composition

```tsx
{
  /* Gallery provides context, GalleryUI consumes it */
}
<Gallery items={items} initialIndex={0}>
  {/* Default internal structure rendered by GalleryUI */}
  <div className='str-chat__gallery'>
    <div className='str-chat__gallery__main'>
      <button className='str-chat__gallery__nav-button--prev' />
      <BaseImage /> {/* or video player */}
      <button className='str-chat__gallery__nav-button--next' />
    </div>
    <div className='str-chat__gallery__position-indicator'>3 / 10</div>
  </div>
</Gallery>;
```

## Customization

### Replacing the UI Component

Users can provide a custom `GalleryUI` component that consumes `GalleryContext`:

```tsx
import { Gallery, useGalleryContext } from 'stream-chat-react';

const CustomGalleryUI = () => {
  const {
    currentItem,
    currentIndex,
    itemCount,
    goToNext,
    goToPrevious,
    hasNext,
    hasPrevious,
  } = useGalleryContext();

  return (
    <div className='my-custom-gallery'>
      {hasPrevious && <button onClick={goToPrevious}>Prev</button>}
      <img src={currentItem.image_url} />
      {hasNext && <button onClick={goToNext}>Next</button>}
      <span>
        {currentIndex + 1} / {itemCount}
      </span>
    </div>
  );
};

// Usage
<Gallery items={attachments} GalleryUI={CustomGalleryUI} />;
```

## Usage Examples

### ModalGallery (Thumbnail Grid with Modal)

This is the most common usage - displays a grid of thumbnails that opens a modal carousel when clicked:

```tsx
import { ModalGallery } from 'stream-chat-react';

const MessageAttachments = ({ attachments }) => {
  return (
    <div className='message-attachments'>
      <ModalGallery items={attachments} />
    </div>
  );
};
```

### Gallery Inline (Embedded Carousel)

Render the carousel directly without modal:

```tsx
import { Gallery } from 'stream-chat-react';

const EmbeddedCarousel = ({ attachments }) => {
  return (
    <div className='carousel-container'>
      <Gallery items={attachments} initialIndex={0} />
    </div>
  );
};
```

### Gallery in Modal (Manual Composition)

For custom control over the modal behavior:

```tsx
import { Gallery, Modal } from 'stream-chat-react';

const MyComponent = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [attachments] = useState<(LocalImageAttachment | LocalVideoAttachment)[]>([]);

  const openGallery = (index: number) => {
    setSelectedIndex(index);
    setIsOpen(true);
  };

  return (
    <>
      <button onClick={() => openGallery(0)}>Open Gallery</button>
      <Modal
        open={isOpen}
        onClose={() => setIsOpen(false)}
        className='str-chat__gallery-modal'
      >
        <Gallery items={attachments} initialIndex={selectedIndex} />
      </Modal>
    </>
  );
};
```

### With Custom UI

```tsx
import { Gallery, useGalleryContext, BaseImage } from 'stream-chat-react';

const MinimalGalleryUI = () => {
  const { currentItem, goToNext, goToPrevious } = useGalleryContext();

  return (
    <div className='minimal-gallery'>
      <button onClick={goToPrevious}>←</button>
      <BaseImage src={currentItem.image_url} alt={currentItem.fallback} />
      <button onClick={goToNext}>→</button>
    </div>
  );
};

<Gallery items={attachments} GalleryUI={MinimalGalleryUI} />;
```
