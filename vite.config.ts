/// <reference types="vitest" />
import { defineConfig } from 'vite';

export default defineConfig({
  test: {
    environment: 'jsdom', // or 'node' if backend only
  },
});
