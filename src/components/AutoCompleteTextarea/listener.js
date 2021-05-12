/* eslint-disable */
export const KEY_CODES = {
  ESC: 27,
  UP: 38,
  DOWN: 40,
  ENTER: 13,
  TAB: 9,
  SPACE: 32,
};

const keycodeMap = {};

// This is self-made key shortcuts manager, used for caching key strokes
class Listener {
  constructor() {
    this.index = 0;
    this.listeners = {};
    this.refCount = 0;

    this.f = (e) => {
      const code = e.keyCode || e.which;

      keycodeMap[code] = e.type === 'keydown';
      if (e.type !== 'keydown') {
        keycodeMap[code] = false;
        return;
      }

      Object.values(this.listeners).forEach(({ keyCode, fn }) => {
        if (keyCode.length > 1) {
          if (keyCode.every((keycode) => keycodeMap[keycode])) {
            fn(e);
          }
        } else if (keyCode.includes(code) && keycodeMap[code]) {
          fn(e);
        }
      });
    };
  }

  startListen = () => {
    if (!this.refCount) {
      // prevent multiple listeners in case of multiple TextareaAutocomplete components on page
      document.addEventListener('keydown', this.f);
      document.addEventListener('keyup', this.f);
    }
    this.refCount++;
  };

  stopListen = () => {
    this.refCount--;
    if (!this.refCount) {
      // prevent disable listening in case of multiple TextareaAutocomplete components on page
      document.removeEventListener('keydown', this.f);
      document.removeEventListener('keyup', this.f);
    }
  };

  add = (keyCodes, fn) => {
    let keyCode = keyCodes;

    if (typeof keyCode !== 'object') keyCode = [keyCode];

    this.listeners[this.index] = {
      keyCode,
      fn,
    };

    this.index += 1;

    return this.index;
  };

  remove = (ids) => {
    for (const key of Object.entries(ids)) {
      delete this.listeners[key];
    }
  };

  removeAll = () => {
    this.listeners = {};
    this.index = 0;
  };
}

export default new Listener();
