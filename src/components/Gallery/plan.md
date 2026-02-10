# Gallery Implementation Plan

## Task Overview

Each task is self-contained. Tasks that modify the same file have dependencies to prevent parallel execution conflicts.

---

## Task 1: GalleryContext

**File to create:** `src/components/Gallery/GalleryContext.tsx`

**Dependencies:** None

**Status:** done

**Owner:** ralph

**Scope:**

- Define `GalleryItem` type as union of `LocalVideoAttachment | LocalImageAttachment` (from `stream-chat`)
- Define `GalleryContextValue` interface:
  ```typescript
  interface GalleryContextValue {
    items: GalleryItem[];
    currentIndex: number;
    currentItem: GalleryItem;
    itemCount: number;
    goToIndex: (index: number) => void;
    goToNext: () => void;
    goToPrevious: () => void;
    hasNext: boolean;
    hasPrevious: boolean;
  }
  ```
- Create React context with `createContext`
- Export `useGalleryContext` hook with error handling for missing provider
- Export types: `GalleryItem`, `GalleryContextValue`

**Acceptance Criteria:**

- [ ] `GalleryContext.tsx` file exists
- [ ] `GalleryItem` type is exported
- [ ] `GalleryContextValue` interface is exported
- [ ] `useGalleryContext` hook is exported and throws error when used outside provider
- [ ] TypeScript compiles without errors

---

## Task 2: Gallery Provider Component

**File to create:** `src/components/Gallery/Gallery.tsx` (replace existing content)

**Dependencies:** Task 1 (GalleryContext.tsx must exist)

**Status:** done

**Owner:** ralph

**Scope:**

- Import context and types from `GalleryContext.tsx`
- Define `GalleryProps` interface:
  ```typescript
  interface GalleryProps {
    items: GalleryItem[];
    initialIndex?: number;
    onIndexChange?: (index: number) => void;
    GalleryUI?: React.ComponentType;
  }
  ```
- Implement state management for `currentIndex` with `useState`
- Implement navigation functions:
  - `goToIndex(index)` - with bounds checking
  - `goToNext()` - increment if possible
  - `goToPrevious()` - decrement if possible
- Compute derived values: `currentItem`, `itemCount`, `hasNext`, `hasPrevious`
- Call `onIndexChange` callback when index changes
- Wrap with `GalleryContext.Provider`
- Render `GalleryUI` prop or lazy-import default `GalleryUI`
- Export `Gallery` component and `GalleryProps` type

**Acceptance Criteria:**

- [ ] `Gallery` component renders without errors when given valid `items`
- [ ] `initialIndex` prop sets the starting index correctly
- [ ] `onIndexChange` callback fires when index changes
- [ ] Context provides correct `hasNext`/`hasPrevious` values at boundaries
- [ ] Navigation functions respect array bounds
- [ ] Custom `GalleryUI` prop replaces default UI
- [ ] TypeScript compiles without errors

---

## Task 3: GalleryUI Component

**File to create:** `src/components/Gallery/GalleryUI.tsx`

**Dependencies:** Task 1 (GalleryContext.tsx must exist)

**Status:** done

**Owner:** ralph

**Scope:**

- Import `useGalleryContext` from `GalleryContext.tsx`
- Import `BaseImage` from `./BaseImage`
- Import `useTranslationContext` for i18n
- Implement component structure:
  ```
  .str-chat__gallery
    .str-chat__gallery__main
      .str-chat__gallery__nav-button--prev (button)
      .str-chat__gallery__media
        BaseImage (for images) or video element (for videos)
      .str-chat__gallery__nav-button--next (button)
    .str-chat__gallery__position-indicator
  ```
- Render image using `BaseImage` component
- Render video with native `<video>` element and play overlay on thumbnail
- Implement loading state (`.str-chat__gallery__loading`)
- Implement error state (`.str-chat__gallery__error`)
- Hide prev button when `!hasPrevious`, hide next button when `!hasNext`
- Display position indicator (e.g., "3 / 10")
- Add keyboard event listener for left/right arrow navigation
- Pause video when navigating away (use `useEffect` cleanup)
- Add ARIA labels for accessibility
- Export `GalleryUI` component

**Acceptance Criteria:**

- [ ] `GalleryUI` component renders current image using `BaseImage`
- [ ] `GalleryUI` component renders current video with play overlay
- [ ] Navigation buttons appear/hide based on `hasNext`/`hasPrevious`
- [ ] Position indicator shows correct "X / Y" format
- [ ] Left/right arrow keys trigger navigation
- [ ] Video pauses when navigating to another item
- [ ] All interactive elements have ARIA labels
- [ ] TypeScript compiles without errors
- [ ] Component uses CSS classes from `styling/Gallery.scss`

---

## Task 4: ModalGallery Component

**File to modify:** `src/components/Gallery/ModalGallery.tsx` (replace existing content)

**Dependencies:** Tasks 1, 2 (GalleryContext.tsx and Gallery.tsx must exist)

**Status:** done

**Owner:** ralph

**Scope:**

- Remove `react-image-gallery` import
- Import `Modal` from `../Modal`
- Import `Gallery` from `./Gallery`
- Import `BaseImage` from `./BaseImage`
- Import `useTranslationContext`, `useComponentContext`
- Define `ModalGalleryProps`:
  ```typescript
  interface ModalGalleryProps {
    items: GalleryItem[];
  }
  ```
- Implement internal state: `modalOpen` (boolean), `selectedIndex` (number)
- Render thumbnail grid:
  ```
  .str-chat__modal-gallery
    .str-chat__modal-gallery__image (for each thumbnail, max 4)
    .str-chat__modal-gallery__placeholder ("+N" for overflow)
  ```
- Add modifier classes: `--two-images`, `--three-images`
- On thumbnail click: set `selectedIndex`, open modal
- Render `Modal` with `Gallery` inside when `modalOpen` is true
- Pass `initialIndex={selectedIndex}` to `Gallery`
- Handle modal close
- Export `ModalGallery` component and `ModalGalleryProps` type

**Acceptance Criteria:**

- [ ] `ModalGallery` component renders thumbnail grid
- [ ] Clicking thumbnail opens modal with `Gallery` at correct index
- [ ] Modal closes via `Modal` component's close mechanisms
- [ ] Shows "+N" placeholder when more than 4 images
- [ ] Modifier classes applied for 2/3 image layouts
- [ ] No `react-image-gallery` imports remain
- [ ] TypeScript compiles without errors
- [ ] Component uses CSS classes from `styling/ModalGallery.scss`

---

## Task 5: Gallery Carousel Styles

**File to create:** `src/components/Gallery/styling/Gallery.scss`

**Dependencies:** None (can work from CSS class spec)

**Status:** done

**Owner:** ralph

**Scope:**

- Style `.str-chat__gallery` (carousel container)
- Style `.str-chat__gallery__main` (main display area, flexbox layout)
- Style `.str-chat__gallery__media` (media container, aspect ratio)
- Style `.str-chat__gallery__media--image` (image-specific styles)
- Style `.str-chat__gallery__media--video` (video-specific styles)
- Style `.str-chat__gallery__nav-button` (navigation buttons)
- Style `.str-chat__gallery__nav-button--prev` (left button positioning)
- Style `.str-chat__gallery__nav-button--next` (right button positioning)
- Style `.str-chat__gallery__position-indicator` (position text)
- Style `.str-chat__gallery__loading` (loading spinner)
- Style `.str-chat__gallery__error` (error state)
- Add `prefers-reduced-motion` media query for animations

**Acceptance Criteria:**

- [ ] `styling/Gallery.scss` file exists
- [ ] All `.str-chat__gallery*` classes are defined
- [ ] Navigation buttons are positioned correctly (left/right sides)
- [ ] Media container maintains aspect ratio
- [ ] Loading and error states are visually distinct
- [ ] Animations respect `prefers-reduced-motion`
- [ ] SCSS compiles without errors

---

## Task 6: ModalGallery Thumbnail Grid Styles

**File to create:** `src/components/Gallery/styling/ModalGallery.scss`

**Dependencies:** None (can work from CSS class spec)

**Status:** done

**Owner:** ralph

**Scope:**

- Style `.str-chat__modal-gallery` (thumbnail grid container, CSS grid)
- Style `.str-chat__modal-gallery--two-images` (2-column layout)
- Style `.str-chat__modal-gallery--three-images` (3-column layout)
- Style `.str-chat__modal-gallery__image` (thumbnail item, aspect ratio)
- Style `.str-chat__modal-gallery__placeholder` ("+N" overlay)
- Style hover/focus states for thumbnails

**Acceptance Criteria:**

- [ ] `styling/ModalGallery.scss` file exists
- [ ] All `.str-chat__modal-gallery*` classes are defined
- [ ] Grid layout works for 1, 2, 3, and 4+ images
- [ ] Placeholder shows "+N" overlay correctly
- [ ] Hover/focus states are visible
- [ ] SCSS compiles without errors

---

## Task 7: Styling Index & Integration

**Files to modify:**

- Create `src/components/Gallery/styling/index.scss`
- Modify `src/styling/index.scss`

**Dependencies:** Tasks 5, 6 (style files must exist)

**Status:** done

**Owner:** ralph

**Scope:**

- Create `styling/index.scss` that imports:
  ```scss
  @use 'Gallery';
  @use 'ModalGallery';
  ```
- Add to `src/styling/index.scss`:
  ```scss
  @use '../components/Gallery/styling' as Gallery;
  ```

**Acceptance Criteria:**

- [ ] `styling/index.scss` exists and imports Gallery.scss and ModalGallery.scss
- [ ] `src/styling/index.scss` includes the Gallery styling import
- [ ] Full SCSS build compiles without errors
- [ ] Gallery components render with correct styles in browser

---

## Task 8: Exports & Public API

**Files to modify:**

- `src/components/Gallery/index.tsx`
- `src/context/ComponentContext.tsx` (add Gallery slot)

**Dependencies:** Tasks 1, 2, 3, 4 (all component files must exist)

**Status:** done

**Owner:** ralph

**Scope:**

- Export from `GalleryContext.tsx`:
  - `useGalleryContext`
  - `GalleryContextValue` (type)
  - `GalleryItem` (type)
- Export from `Gallery.tsx`:
  - `Gallery`
  - `GalleryProps` (type)
- Export from `GalleryUI.tsx`:
  - `GalleryUI`
- Export from `ModalGallery.tsx`:
  - `ModalGallery`
  - `ModalGalleryProps` (type)
- Keep existing exports:
  - `BaseImage`, `BaseImageProps`
  - `Image` (legacy)
- Update `ComponentContext` to include `Gallery` slot for customization

**Acceptance Criteria:**

- [ ] `Gallery`, `GalleryProps` are exported from index
- [ ] `GalleryUI` is exported from index
- [ ] `ModalGallery`, `ModalGalleryProps` are exported from index
- [ ] `useGalleryContext`, `GalleryContextValue`, `GalleryItem` are exported from index
- [ ] Existing exports (`BaseImage`, `Image`) still work
- [ ] `ComponentContext` includes `Gallery` slot
- [ ] TypeScript compiles without errors
- [ ] Imports from `stream-chat-react` resolve correctly

---

## Task 9: Remove react-image-gallery Dependency

**Files to modify:** `package.json`

**Dependencies:** Tasks 4, 8 (ModalGallery refactored, exports updated)

**Status:** done

**Owner:** ralph

**Scope:**

- Remove `react-image-gallery` from dependencies
- Remove `@types/react-image-gallery` from devDependencies (if exists)
- Run `npm install` / `yarn` to update lockfile

**Acceptance Criteria:**

- [x] `react-image-gallery` is not in package.json dependencies
- [x] `@types/react-image-gallery` is not in package.json devDependencies
- [x] Lockfile is updated
- [x] `yarn` completes without errors
- [x] Build completes without errors
- [x] No imports of `react-image-gallery` exist in codebase

---

## Task 10: Tests

**Files to create/modify:** `src/components/Gallery/__tests__/`

**Dependencies:** Tasks 1-4, 8 (all components and exports must exist)

**Status:** done

**Owner:** ralph

**Scope:**

- Create `GalleryContext.test.tsx`:
  - Test `useGalleryContext` throws error without provider
  - Test context values are provided correctly
- Create `Gallery.test.tsx`:
  - Test renders with items
  - Test `initialIndex` prop
  - Test `onIndexChange` callback
  - Test navigation functions
  - Test custom `GalleryUI` prop
- Create `GalleryUI.test.tsx`:
  - Test renders current item
  - Test navigation buttons visibility
  - Test keyboard navigation
  - Test position indicator
- Update `ModalGallery.test.js`:
  - Test thumbnail grid rendering
  - Test modal opens on thumbnail click
  - Test correct index passed to Gallery

**Acceptance Criteria:**

- [ ] All new test files exist in `__tests__/` directory
- [ ] `useGalleryContext` error handling is tested
- [ ] `Gallery` navigation and callbacks are tested
- [ ] `GalleryUI` rendering and interactions are tested
- [ ] `ModalGallery` thumbnail grid and modal behavior are tested
- [ ] All tests pass
- [ ] Code coverage meets project requirements

---

## Execution Order

```
Phase 1 (Parallel):
├── Task 1: GalleryContext
├── Task 5: Gallery Carousel Styles
└── Task 6: ModalGallery Styles

Phase 2 (After Task 1):
├── Task 2: Gallery Provider
└── Task 3: GalleryUI

Phase 3 (After Tasks 2, 3):
└── Task 4: ModalGallery

Phase 4 (After Tasks 5, 6):
└── Task 7: Styling Integration

Phase 5 (After Tasks 1-4):
└── Task 8: Exports

Phase 6 (After Task 8):
├── Task 9: Remove Dependency
└── Task 10: Tests
```

---

## File Ownership Summary

| Task | Creates/Modifies                               |
| ---- | ---------------------------------------------- |
| 1    | `GalleryContext.tsx`                           |
| 2    | `Gallery.tsx`                                  |
| 3    | `GalleryUI.tsx`                                |
| 4    | `ModalGallery.tsx`                             |
| 5    | `styling/Gallery.scss`                         |
| 6    | `styling/ModalGallery.scss`                    |
| 7    | `styling/index.scss`, `src/styling/index.scss` |
| 8    | `index.tsx`                                    |
| 9    | `package.json`                                 |
| 10   | `__tests__/*`                                  |
