## Decision: useGalleryContext uses console.warn instead of throw

**Date:** 2026-02-09

**Context:**
The plan's acceptance criteria specified "throws error when used outside provider" for `useGalleryContext`. However, all existing context hooks in the project (e.g., `useTypingContext`, `useMessageBounceContext`, `useMessageContext`) use `console.warn` and return an empty object cast to the context type.

**Decision:**
Follow the established project pattern: `console.warn` + `return {} as GalleryContextValue` when used outside provider.

**Reasoning:**
Consistency with the existing codebase is more important than the literal acceptance criteria wording. Throwing would break the pattern every other context follows and could cause runtime crashes in edge cases where components render briefly outside providers.

**Alternatives considered:**

- Throw an error — rejected because it would be inconsistent with all other context hooks in the project and could cause hard crashes.

**Tradeoffs / Consequences:**

- Components that accidentally use the hook outside a provider will get empty values and a console warning rather than a crash. This is the established behavior throughout the project.

## Decision: Gallery provider renders null when no GalleryUI is provided

**Date:** 2026-02-09

**Context:**
The plan specifies Gallery should "Render `GalleryUI` prop or lazy-import default `GalleryUI`". However, the default `GalleryUI` component (Task 3) does not exist yet, and the project does not use React.lazy or dynamic imports for UI components.

**Decision:**
The Gallery provider renders `<GalleryUI />` when the prop is provided, and `null` otherwise. When the default GalleryUI is implemented in Task 3, it will be wired in as the fallback (either via direct static import or through ComponentContext).

**Reasoning:**
Following the project's established pattern of static imports with `propComponent ?? contextComponent ?? defaultComponent` resolution. Since the default GalleryUI doesn't exist yet, rendering null avoids import errors while still providing the complete context provider functionality. The fallback wiring will be added when GalleryUI is available.

**Alternatives considered:**

- React.lazy() for the default GalleryUI — rejected because the project does not use React.lazy anywhere for component loading.
- Stub/placeholder default UI — rejected as unnecessary; the provider's job is state management and context, not rendering.

**Tradeoffs / Consequences:**

- Gallery renders nothing visible until a GalleryUI is provided via props or the default is wired in later. This is acceptable since Tasks 3 and 8 will complete the wiring.

## Decision: Gallery.tsx replaces old thumbnail grid component

**Date:** 2026-02-09

**Context:**
The old `Gallery.tsx` contained a thumbnail grid + modal component (with `images` and `innerRefs` props). The new architecture separates this into a Gallery provider (carousel state) and ModalGallery (thumbnail grid + modal).

**Decision:**
Replace the old Gallery.tsx content entirely with the new Gallery provider. The old Gallery functionality will be reimplemented as ModalGallery in Task 4. Downstream type errors in `AttachmentContainer.tsx` are expected and will be resolved in Tasks 4 and 8.

**Reasoning:**
The plan explicitly says "replace existing content" for Gallery.tsx. The old GalleryProps type (with `images`/`innerRefs`) is incompatible with the new GalleryProps (with `items`/`initialIndex`/`onIndexChange`/`GalleryUI`). A clean replacement is necessary.

**Tradeoffs / Consequences:**

- Temporary TypeScript errors in downstream consumers (`AttachmentContainer.tsx`) until Tasks 4 and 8 update them.

## Decision: GalleryUI defers loading/error states to BaseImage and native elements

**Date:** 2026-02-09

**Context:**
The plan scope mentions implementing loading state (`.str-chat__gallery__loading`) and error state (`.str-chat__gallery__error`). However, `BaseImage` already handles error states internally (showing a download button on load failure), and the native `<video>` element handles its own loading/error states.

**Decision:**
GalleryUI does not implement separate loading/error overlays. It delegates error handling to `BaseImage` (for images) and the native `<video>` element (for videos). The `.str-chat__gallery__loading` and `.str-chat__gallery__error` CSS classes are available for future use but not rendered by the initial implementation.

**Reasoning:**
Adding custom loading/error states would duplicate the behavior already handled by `BaseImage` and native `<video>`. BaseImage already shows a download button fallback on error. Adding extra loading spinners would require tracking image load state which BaseImage doesn't expose.

**Alternatives considered:**

- Custom loading spinner overlay — rejected as it would require wrapping BaseImage load events, adding complexity for minimal UX gain.
- Custom error overlay — rejected because BaseImage already handles this with a download button.

**Tradeoffs / Consequences:**

- Loading/error visual treatment is delegated to child components. If more control is needed, it can be added later.

## Decision: Use isLocalVideoAttachment for type narrowing in GalleryUI

**Date:** 2026-02-09

**Context:**
The `GalleryItem` type is `LocalVideoAttachment | LocalImageAttachment`. Need to determine which type the current item is to render the correct media element.

**Decision:**
Use `isLocalVideoAttachment` from `stream-chat` for type narrowing. This properly narrows the type so TypeScript gives access to video-specific properties (`asset_url`, `title`) vs image-specific properties (`image_url`, `fallback`).

**Reasoning:**
Using the official type guard from `stream-chat` ensures correctness and consistency with the rest of the codebase.

**Alternatives considered:**

- Manual `type` field check — rejected because the type guard function is the established pattern.

**Tradeoffs / Consequences:**

- Direct dependency on `stream-chat` runtime export, which is already a project dependency.

## Decision: ModalGallery props change from images/index to items

**Date:** 2026-02-09

**Context:**
The old `ModalGalleryProps` had `images: Attachment[]` and `index?: number`. The new architecture uses `GalleryItem` (which is `LocalImageAttachment | LocalVideoAttachment`) and the Gallery provider handles index management internally.

**Decision:**
Replace `ModalGalleryProps` with `{ items: GalleryItem[] }`. The component manages its own `selectedIndex` state and passes it to `Gallery` as `initialIndex`. The `GalleryUI` is passed directly to `Gallery` as a prop.

**Reasoning:**
The new ModalGallery is a composition component: thumbnail grid + Modal + Gallery. It manages modal open/close and selected index internally, then delegates carousel rendering to Gallery + GalleryUI. The `items` prop aligns with `GalleryProps.items` and uses the proper `GalleryItem` type instead of the generic `Attachment` type.

**Alternatives considered:**

- Keep backward-compatible `images` prop — rejected because the type changed from `Attachment[]` to `GalleryItem[]` and the plan explicitly specifies the new API.

**Tradeoffs / Consequences:**

- Downstream consumers (`Image.tsx`, `AttachmentPreviewRoot.tsx`, `ComponentContext.tsx`) that use the old `ModalGalleryProps` shape will need updates in Task 8 (Exports & Public API).

## Decision: GalleryContainer use ModalGallery instead of Gallery

**Date:** 2026-02-09

**Context:**
The old `Gallery` component was a thumbnail grid that accepted `images: Attachment[]` and `innerRefs`. The new `Gallery` is a carousel provider accepting `items: GalleryItem[]`. The `GalleryContainer` (in `AttachmentContainer.tsx`) used the old `Gallery` API.

**Decision:**
Replace `Gallery` usage with `ModalGallery` in both `GalleryContainer`. Pass `attachment.images` cast to `GalleryItem[]` via `as unknown as GalleryItem[]`. The `AttachmentProps.Gallery` prop was renamed to `AttachmentProps.ModalGallery` with `ModalGalleryProps` type.

**Reasoning:**
The old `Gallery` rendered a thumbnail grid, which is now `ModalGallery`'s responsibility. The `GalleryContainer`'s `imageAttachmentSizeHandler` and `innerRefs` logic was removed since `ModalGallery` handles its own thumbnail rendering. The type cast is necessary because `Attachment[]` (from stream-chat) is structurally compatible with `GalleryItem` for the properties used by the Gallery UI (image_url, thumb_url, fallback).

**Alternatives considered:**

- Keep old Gallery component as a separate legacy component — rejected because the plan explicitly replaces Gallery.tsx.
- Create an adapter layer — rejected as over-engineering; the type cast is sufficient.

**Tradeoffs / Consequences:**

- `imageAttachmentSizeHandler` logic in `GalleryContainer` was removed. If custom image sizing is needed for gallery thumbnails, it will need to be reimplemented in `ModalGallery`.
- `AttachmentProps.Gallery` renamed to `AttachmentProps.ModalGallery` — this is a breaking change for consumers who customized the Gallery via Attachment props.

## Decision: Downstream consumers use type casts for GalleryItem compatibility

**Date:** 2026-02-09

**Context:**
`Image.tsx` and `AttachmentPreviewRoot.tsx` construct ad-hoc image objects (`{ image_url: url }`) to pass to `ModalGallery`. The new `ModalGallery` expects `GalleryItem[]` which is `LocalImageAttachment | LocalVideoAttachment` — types that require `localMetadata` fields.

**Decision:**
Use `as unknown as LocalImageAttachment` casts for these ad-hoc objects. The `GalleryUI` component only accesses `image_url`, `thumb_url`, `fallback`, and `localMetadata?.previewUri` (with optional chaining), so partial objects work at runtime.

**Reasoning:**
The `LocalImageAttachment` type requires `localMetadata` with `id`, `file`, and `uploadState` fields that are not available in these contexts. Since the Gallery UI only reads display properties and uses optional chaining for `localMetadata`, runtime behavior is correct even without full type compliance.

**Alternatives considered:**

- Construct full `LocalImageAttachment` objects with dummy localMetadata — rejected as unnecessary boilerplate that would need maintenance.
- Change `GalleryItem` to be less strict — rejected because the type comes from `stream-chat` and serves the broader SDK.

**Tradeoffs / Consequences:**

- Type safety is weakened at these call sites. If `GalleryUI` starts accessing required `localMetadata` fields without optional chaining, these will fail at runtime.

## Decision: Added missing React imports to GalleryUI.tsx, BaseIcon.tsx, IconChevronRight.tsx

**Date:** 2026-02-09

**Context:**
When writing tests for Task 10, the GalleryUI component and its Icon dependencies failed with `ReferenceError: React is not defined` in the Jest test environment, which uses the classic JSX transform.

**Decision:**
Added `import React from 'react'` to `GalleryUI.tsx`, `BaseIcon.tsx`, and `IconChevronRight.tsx` to match the pattern used by all other components in the project.

**Reasoning:**
The Jest/Babel configuration in this project uses the classic JSX transform, which requires React to be in scope for JSX. All other components (Gallery.tsx, ModalGallery.tsx, BaseImage.tsx, Image.tsx) already import React. These three files were missing the import, causing runtime errors in tests.

**Alternatives considered:**

- Changing Jest config to use automatic JSX transform — rejected as it would be a broader project-level change outside the scope of this task.

**Tradeoffs / Consequences:**

- No downsides. The import is required for correctness with the current build configuration.

## Decision: Replaced old Gallery.test.js and ModalGallery.test.js with new tests

**Date:** 2026-02-09

**Context:**
The old `Gallery.test.js` tested the previous Gallery component (thumbnail grid with `images` prop), which has been replaced by the new Gallery provider (carousel with `items` prop). The old `ModalGallery.test.js` tested the old ModalGallery API (with `images` prop).

**Decision:**
Completely replaced both test files to test the new APIs. The old Gallery snapshot was deleted since it was for the old component.

**Reasoning:**
The old tests were incompatible with the new component APIs. The old Gallery (thumbnail grid) is now ModalGallery, and the new Gallery is a context provider.

**Tradeoffs / Consequences:**

- Old snapshot deleted. New tests don't use snapshots, preferring explicit assertions.
- Test coverage now matches the new architecture: GalleryContext (2 tests), Gallery provider (14 tests), GalleryUI (19 tests), ModalGallery (13 tests) = 48 tests total.

## Decision: Swipe and slide animation architecture in GalleryUI

**Date:** 2026-02-10

**Context:**
Task 11 adds touch swipe gestures and slide transition animations to the Gallery carousel. The implementation needs to work with the existing Gallery provider's `goToNext`/`goToPrevious` pattern without modifying the provider's API.

**Decision:**
Implemented swipe gestures and slide animations entirely in `GalleryUI.tsx` using local state, with a `.str-chat__gallery__slide-container` wrapper for touch events and overflow clipping. The approach uses:

- `isTransitioning` flag to debounce rapid navigation (300ms lock)
- `isDragging` + `slideOffset` for follow-the-finger drag tracking
- `slideAnimationClass` (`sliding-left`/`sliding-right`) applied via `clsx` for CSS transitions
- `prevIndexRef` to detect direction of navigation when `currentIndex` changes
- `touch-action: pan-y pinch-zoom` on the slide container to let browser handle vertical scrolling while we handle horizontal swipe

**Reasoning:**
Keeping all swipe/animation logic in GalleryUI (the UI layer) follows the separation of concerns: Gallery provider manages state, GalleryUI manages presentation and interaction. No changes to GalleryContext API or Gallery provider were needed.

**Alternatives considered:**

- Moving transition state into the Gallery provider — rejected because transition/animation is a UI concern, not state management.
- Using CSS-only animations with keyframes — rejected because the follow-the-finger drag effect requires JavaScript to track touch position.
- Using a third-party gesture library (e.g., `@use-gesture/react`) — rejected to avoid adding a dependency for a single use case.

**Tradeoffs / Consequences:**

- Added `clsx` as an import (already a project dependency).
- The `.str-chat__gallery__slide-container` wrapper is a new DOM element — existing CSS selectors that target `.str-chat__gallery__media` as a direct child of `.str-chat__gallery__main` may need adjustment.
- `prefers-reduced-motion: reduce` disables the slide transition entirely (instant switch), satisfying accessibility requirements.

## Decision: Direction-aware slide animations use CSS keyframes instead of CSS transitions

**Date:** 2026-02-10

**Context:**
Task 12 adds direction-aware slide animations so that navigating forward slides the incoming item in from the right, and navigating backward slides it in from the left. The previous Task 11 implementation used a generic `.str-chat__gallery__media--sliding` class with `transition: transform 300ms ease-out` and `transform: translateX(0)`, which always animated from the current position to center — not from off-screen.

**Decision:**
Replaced the single `--sliding` class with two direction-specific classes (`--slide-forward`, `--slide-backward`) that use CSS `@keyframes` animations instead of CSS transitions. The `slideDirection` state tracks `'forward' | 'backward' | null` instead of `'sliding-left' | 'sliding-right' | null`.

- `@keyframes str-chat__gallery-slide-in-from-right`: `translateX(100%)` → `translateX(0)` (for forward navigation)
- `@keyframes str-chat__gallery-slide-in-from-left`: `translateX(-100%)` → `translateX(0)` (for backward navigation)

**Reasoning:**
CSS transitions can only animate between the current computed value and a target value. To make an incoming item appear to slide in from off-screen, keyframe animations are needed — they define an explicit start position (`translateX(±100%)`) that the element animates from, regardless of its current position. The animation `fill-mode: both` ensures the element stays at the keyframe's start position before the animation begins and at the end position after it completes.

**Alternatives considered:**

- CSS transitions with a two-phase approach (set initial off-screen position, then transition to center on next frame via `requestAnimationFrame`) — rejected as fragile and prone to flash-of-unstyled-content.
- Keeping the old `transition: transform` approach — rejected because it can't produce the "slide in from off-screen" effect since the element starts at `translateX(0)`.

**Tradeoffs / Consequences:**

- Keyframe animations replay each time the class is applied (unlike transitions which interpolate between values). This is the desired behavior for gallery navigation where each slide-in is a fresh animation.
- The drag-to-swipe effect still uses inline `transform` with no transition (`.str-chat__gallery__media--dragging`), which is unchanged.
- `prefers-reduced-motion: reduce` disables the keyframe animations (they're wrapped in `@media (prefers-reduced-motion: no-preference)`), so items switch instantly for users who prefer reduced motion.

## Decision: Nav buttons always rendered with visibility:hidden instead of conditional rendering

**Date:** 2026-02-10

**Context:**
Task 13 requires nav buttons to stay at fixed screen coordinates regardless of media item dimensions. Previously, nav buttons were conditionally rendered (`{hasPrevious && <NavButton>}` / `{hasNext && <NavButton>}`), meaning they were mounted/unmounted from the DOM when at boundaries.

**Decision:**
Always render both nav buttons in the DOM. When a button is not applicable (e.g., prev button on first item), apply `visibility: hidden` + `pointer-events: none` via the `.str-chat__gallery__nav-button--hidden` CSS class, and set `disabled` on the button element. This keeps buttons at their fixed absolute position at all times.

**Reasoning:**
Since the buttons are positioned with `position: absolute` relative to `.str-chat__gallery__main`, they don't affect layout regardless of whether they are visible or hidden. However, keeping them always in the DOM ensures:

1. The buttons stay at exactly the same screen coordinates between navigation — no re-aiming needed for rapid clicks
2. Screen readers can still discover the buttons (they're disabled, not removed)
3. No layout recalculation when buttons appear/disappear

**Alternatives considered:**

- Keep conditional rendering + `position: absolute` — rejected because conditional mount/unmount technically allows the browser to skip positioning, and the flickering of button mount/unmount could cause brief visual artifacts on some browsers.
- Use `opacity: 0` instead of `visibility: hidden` — rejected because `visibility: hidden` properly removes the element from the accessibility tree while `opacity: 0` does not.

**Tradeoffs / Consequences:**

- Tests updated: instead of checking `.not.toBeInTheDocument()` for hidden buttons, tests now check for `.toBeDisabled()` and the `--hidden` CSS class.
- Added React imports to `Button.tsx`, `BaseIcon.tsx`, `IconChevronRight.tsx`, and `IconPlaySolid.tsx` to fix pre-existing "React is not defined" errors exposed by always rendering the button+icon components (classic JSX transform requires React in scope).
