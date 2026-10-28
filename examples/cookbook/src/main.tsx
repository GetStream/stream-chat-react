import { StrictMode } from 'react';
import type { ReactNode } from 'react';
import ReactDOM from 'react-dom/client';
import { BaseApp } from './base/BaseApp';
import { listRecipes, loadRecipe } from './base/recipe';
import './base/base.css';

const root = ReactDOM.createRoot(document.getElementById('root') as HTMLElement);
const params = new URLSearchParams(window.location.search);
const recipeId = params.get('recipe');

// Screens outside the app carry `str-chat`, so the SDK's tokens resolve in them too.
const Status = ({ children }: { children: ReactNode }) => (
  <div className='str-chat cookbook-status'>{children}</div>
);

const RecipeIndex = () => (
  <Status>
    <ul>
      {listRecipes().map(({ id, variant }) => (
        <li key={`${id}/${variant}`}>
          <a href={`?recipe=${id}&variant=${variant}`}>
            {id} ({variant})
          </a>
        </li>
      ))}
    </ul>
  </Status>
);

const start = async () => {
  // The cookbook's look is the theme the Theming › Brand theme and dark mode recipe builds.
  // `?look=sdk` leaves it out, for screenshots of the SDK's own default look.
  if (params.get('look') !== 'sdk') {
    const [{ loadFont }] = await Promise.all([
      import('./recipes/theming/brand-theme-and-dark-mode/loadFont'),
      import('./recipes/theming/brand-theme-and-dark-mode/theme.css'),
    ]);
    loadFont();
  }

  // No `?recipe=` shows the list of recipes; `?recipe=base` is the base app on its own.
  if (!recipeId) return root.render(<RecipeIndex />);

  const variant = params.get('variant') || 'default';
  const recipe = recipeId === 'base' ? {} : await loadRecipe(recipeId, variant);
  if (!recipe) {
    return root.render(
      <Status>
        No recipe “{recipeId}” with a variant “{variant}”.
      </Status>,
    );
  }

  root.render(
    <StrictMode>
      <BaseApp recipe={recipe} />
    </StrictMode>,
  );
};

start().catch((error: unknown) => {
  console.error(error);
  root.render(<Status>The recipe failed to load: {String(error)}</Status>);
});
