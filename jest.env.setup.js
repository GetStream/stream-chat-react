/* eslint-disable no-undef */
const crypto = require('crypto');

Object.defineProperty(globalThis, 'crypto', {
  value: {
    getRandomValues: (arr) => {
      for (let i = 0; i < arr.length; i++) {
        arr[i] = Math.floor(Math.random() * 256);
      }
      return arr;
    },
  },
});

// Mock proper File API behavior
if (typeof File === 'undefined') {
  class File extends Blob {
    constructor(bits, name, options = {}) {
      super(bits, options);
      this.name = name;
      this.lastModified = options.lastModified || Date.now();
    }
  }
  global.File = File;
}

// Ensure FileReader is available
if (typeof FileReader === 'undefined') {
  class FileReader {
    readAsDataURL(blob) {
      const result = `data:${blob.type};base64,${Buffer.from(blob).toString('base64')}`;
      setTimeout(() => {
        this.result = result;
        this.onload?.();
      }, 0);
    }
  }
  global.FileReader = FileReader;
}

// Mock URL.createObjectURL
if (typeof URL.createObjectURL === 'undefined') {
  URL.createObjectURL = (file) => `blob:${file.name}`;
}
// Mock URL.createObjectURL
if (typeof URL.revokeObjectURL === 'undefined') {
  URL.revokeObjectURL = () => null;
}
