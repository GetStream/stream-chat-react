// Fails when a generated UI renderer's own elements read a colour that `ai-components.css` leaves
// to the package: A2UI's basic catalog falls back to a light theme's literals, and OpenUI's
// defaults follow the person's system rather than Stream's theme, so a dark reply would show
// light text or surfaces. Run after `yarn build`, which writes `dist/css/ai-components.css`.
//
// It checks every component of A2UI's basic catalog, not only those Stream leaves to A2UI,
// since an app can hand any back with `basicComponents`, and every component in the stylesheet
// of OpenUI's that apps import.
import { readdirSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import {
  declaredIn,
  type Finding,
  unsetA2UIColours,
  unsetOpenUIColours,
} from './ai-ui-token-audit.mts';

const root = resolve(import.meta.dirname, '..');
const read = (path: string) => readFileSync(resolve(root, path), 'utf8');

// Colours left to the package on purpose, each with why.
const ALLOWED_OPENUI: Record<string, string> = {
  '--openui-shadow-m':
    'a translucent black shadow, which reads on light and dark surfaces',
  '--openui-shadow-s':
    'a translucent black shadow, which reads on light and dark surfaces',
};

const css = read('dist/css/ai-components.css');

const a2uiDirectory =
  'node_modules/@a2ui/web_core/src/universal/basic_catalog/components';
const a2uiSources = Object.fromEntries(
  readdirSync(resolve(root, a2uiDirectory))
    .filter((file) => file.endsWith('.js') && !file.endsWith('.test.js'))
    .map((file) => [file, read(`${a2uiDirectory}/${file}`)]),
);
if (Object.keys(a2uiSources).length < 15) {
  throw new Error(
    `found only ${Object.keys(a2uiSources).length} A2UI components in ${a2uiDirectory}`,
  );
}

const openUI = 'node_modules/@openuidev/react-ui/dist';

const report = (label: string, findings: Finding[]) => {
  for (const { name, source, value } of findings) {
    console.error(`${label}: ${name} (read by ${source}) is left to ${value}`);
  }
  return findings.length;
};

const failures =
  report('A2UI', unsetA2UIColours(a2uiSources, declaredIn(css, '.str-chat__a2ui'))) +
  report(
    'OpenUI',
    unsetOpenUIColours(
      read(`${openUI}/components/index.css`),
      read(`${openUI}/openui-defaults.css`),
      declaredIn(css, '.str-chat__openui'),
      ALLOWED_OPENUI,
    ),
  );

if (failures) {
  console.error(
    `\n${failures} colour(s) the renderers read are not set from the AI components' tokens. Set each in .str-chat__a2ui (a2ui.scss) or .str-chat__openui (openui.scss).`,
  );
  process.exit(1);
}
console.log(
  `A2UI and OpenUI read no colour that ai-components.css leaves unset (${Object.keys(a2uiSources).length} A2UI components checked)`,
);
