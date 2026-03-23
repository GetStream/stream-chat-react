import '@testing-library/jest-dom/vitest';
import * as vitestAxeMatchers from 'vitest-axe/matchers';

expect.extend(vitestAxeMatchers);

process.env.TZ = 'UTC';

Object.defineProperty(globalThis, 'crypto', {
  value: {
    getRandomValues: (arr: Uint8Array) => {
      for (let i = 0; i < arr.length; i++) {
        arr[i] = Math.floor(Math.random() * 256);
      }
      return arr;
    },
  },
});

Object.defineProperty(globalThis, 'structuredClone', {
  value: (val: unknown) => JSON.parse(JSON.stringify(val)),
});

// Mock proper File API behavior
if (typeof File === 'undefined') {
  class FilePoly extends Blob {
    name: string;
    lastModified: number;
    constructor(bits: BlobPart[], name: string, options: FilePropertyBag = {}) {
      super(bits, options);
      this.name = name;
      this.lastModified = options.lastModified || Date.now();
    }
  }
  // @ts-expect-error polyfill
  globalThis.File = FilePoly;
}

// Ensure FileReader is available
if (typeof FileReader === 'undefined') {
  class FileReaderPoly {
    result: string | null = null;
    onload: (() => void) | null = null;
    readAsDataURL(blob: Blob) {
      const result = `data:${blob.type};base64,${Buffer.from(blob as unknown as ArrayBuffer).toString('base64')}`;
      setTimeout(() => {
        this.result = result;
        this.onload?.();
      }, 0);
    }
  }
  // @ts-expect-error polyfill
  globalThis.FileReader = FileReaderPoly;
}

// Mock URL.createObjectURL
if (typeof URL.createObjectURL === 'undefined') {
  URL.createObjectURL = (file: Blob) => `blob:${(file as File).name}`;
}
if (typeof URL.revokeObjectURL === 'undefined') {
  URL.revokeObjectURL = () => {};
}

if (typeof window !== 'undefined' && typeof window.matchMedia === 'undefined') {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: (query: string) => ({
      addEventListener: () => null,
      addListener: () => null,
      dispatchEvent: () => false,
      matches: false,
      media: query,
      onchange: null,
      removeEventListener: () => null,
      removeListener: () => null,
    }),
  });
}

// Mock HTMLCanvasElement.getContext for vitest-axe/axe-core
HTMLCanvasElement.prototype.getContext = (() => null) as any;
