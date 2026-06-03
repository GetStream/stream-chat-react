import { render, screen } from '@testing-library/react';
import { vi } from 'vitest';

import { ComponentProvider } from '../../../context';
import { mockComponentContext } from '../../../mock-builders';
import { VideoPlayer } from '../VideoPlayer';

// Stub react-player so the test exercises the lazy/Suspense wiring (not the real
// player internals). The wrapper unwraps the CJS `default`, so exposing the
// component on `default` mirrors the real module shape.
vi.mock('react-player', () => ({
  default: ({ url }: { url?: string }) => (
    <div className='react-player' data-testid='react-player'>
      {url}
    </div>
  ),
}));

describe('VideoPlayer', () => {
  it('lazily renders the default react-player when no override is set', async () => {
    render(
      <ComponentProvider value={mockComponentContext({})}>
        <VideoPlayer videoUrl='https://example.com/clip.mp4' />
      </ComponentProvider>,
    );

    // Resolves asynchronously because react-player is behind React.lazy.
    const player = await screen.findByTestId('react-player');
    expect(player).toHaveTextContent('https://example.com/clip.mp4');
  });

  it('renders the ComponentContext override without loading react-player', () => {
    const CustomVideoPlayer = ({ videoUrl }: { videoUrl?: string }) => (
      <div data-testid='custom-video-player'>{videoUrl}</div>
    );

    render(
      <ComponentProvider value={mockComponentContext({ VideoPlayer: CustomVideoPlayer })}>
        <VideoPlayer videoUrl='https://example.com/clip.mp4' />
      </ComponentProvider>,
    );

    expect(screen.getByTestId('custom-video-player')).toBeInTheDocument();
    expect(screen.queryByTestId('react-player')).not.toBeInTheDocument();
  });
});
