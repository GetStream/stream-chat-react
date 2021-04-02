import { isValidElementType } from 'react-is';

export const DEFAULT_CARET_POSITION = 'next';

export function defaultScrollToItem(container, item) {
  if (!item) return;

  const itemHeight = parseInt(getComputedStyle(item).getPropertyValue('height'), 10);

  const containerHight =
    parseInt(getComputedStyle(container).getPropertyValue('height'), 10) - itemHeight;

  const actualScrollTop = container.scrollTop;
  const itemOffsetTop = item.offsetTop;

  if (itemOffsetTop < actualScrollTop + containerHight && actualScrollTop < itemOffsetTop) {
    return;
  }

  // eslint-disable-next-line
  container.scrollTop = itemOffsetTop;
}

export const errorMessage = (message) =>
  console.error(
    `RTA: dataProvider fails: ${message}
    \nCheck the documentation or create issue if you think it's bug. https://github.com/webscopeio/react-textarea-autocomplete/issues`,
  );

export const triggerPropsCheck = ({ trigger }) => {
  if (!trigger) return Error('Invalid prop trigger. Prop missing.');

  const triggers = Object.entries(trigger);

  for (let i = 0; i < triggers.length; i += 1) {
    const [triggerChar, settings] = triggers[i];

    if (typeof triggerChar !== 'string' || triggerChar.length !== 1) {
      return Error('Invalid prop trigger. Keys of the object has to be string / one character.');
    }

    // $FlowFixMe
    const triggerSetting = settings;

    const { callback, component, dataProvider, output } = triggerSetting;

    if (!isValidElementType(component)) {
      return Error('Invalid prop trigger: component should be defined.');
    }

    if (!dataProvider || typeof dataProvider !== 'function') {
      return Error('Invalid prop trigger: dataProvider should be defined.');
    }

    if (output && typeof output !== 'function') {
      return Error('Invalid prop trigger: output should be a function.');
    }

    if (callback && typeof callback !== 'function') {
      return Error('Invalid prop trigger: callback should be a function.');
    }
  }

  return null;
};
