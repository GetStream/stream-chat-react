import { currentUser } from '../../../base/client';
import savedLayout from './saved-layout.json';

/**
 * Screenshot helper, not part of the recipe. `?seed-layout=1` writes a layout saved before a
 * reload, so the first load of a shot shows the restore. Runs when the recipe module loads,
 * before `LayoutPersistence` reads the storage.
 */
export const seedSavedLayout = () => {
  if (new URLSearchParams(window.location.search).get('seed-layout') !== '1') return;
  localStorage.setItem(`chat-layout:v1:${currentUser.id}`, JSON.stringify(savedLayout));
};
