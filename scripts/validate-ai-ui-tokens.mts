// Fails when a generated UI renderer's own elements read a colour that its stylesheet
// (`a2ui.css`, `openui.css`) leaves to the package: A2UI's basic catalog falls back to a light theme's literals, and OpenUI's
// defaults follow the person's system rather than Stream's theme, so a dark reply would show
// light text or surfaces. Run after `yarn build`, which writes `dist/css/a2ui.css` and `dist/css/openui.css`.
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

// Colours left to the package on purpose, each with why. None: the shadows are the SDK's too.
const ALLOWED_OPENUI: Record<string, string> = {};

const a2uiCss = read('dist/css/a2ui.css');
const openUICss = read('dist/css/openui.css');

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
  report('A2UI', unsetA2UIColours(a2uiSources, declaredIn(a2uiCss, '.str-chat__a2ui'))) +
  report(
    'OpenUI',
    unsetOpenUIColours(
      read(`${openUI}/components/index.css`),
      read(`${openUI}/openui-defaults.css`),
      declaredIn(openUICss, '.str-chat__openui'),
      ALLOWED_OPENUI,
    ),
  );

// Sizes and type the renderers work out on `:root`, which a stylesheet must set step by step.
const REQUIRED: Array<[string, string, string[]]> = [
  [
    'A2UI',
    a2uiCss,
    ['xs', 's', 'm', 'l', 'xl'].flatMap((step) => [
      `--a2ui-font-size-${step}`,
      `--a2ui-spacing-${step}`,
    ]),
  ],
  [
    'OpenUI',
    openUICss,
    ['xs', 'sm', 'default', 'lg'].flatMap((level) => [
      `--openui-text-body-${level}`,
      `--openui-text-label-${level}`,
    ]),
  ],
];
let missing = 0;
for (const [label, rendererCss, names] of REQUIRED) {
  const declared = declaredIn(
    rendererCss,
    label === 'A2UI' ? '.str-chat__a2ui' : '.str-chat__openui',
  );
  for (const name of names.filter((variable) => !declared.has(variable))) {
    console.error(`${label}: ${name} is not set from the SDK's tokens`);
    missing += 1;
  }
}

if (failures || missing) {
  console.error(
    `\n${failures + missing} variable(s) the renderers read are not set from the SDK's tokens. Set each in .str-chat__a2ui (src/plugins/A2UI/styling) or .str-chat__openui (src/plugins/OpenUI/styling).`,
  );
  process.exit(1);
}
console.log(
  `A2UI and OpenUI read no colour that a2ui.css and openui.css leave unset (${Object.keys(a2uiSources).length} A2UI components checked)`,
);
