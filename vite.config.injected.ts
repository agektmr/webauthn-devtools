/**
 * Copyright 2025 Eiji Kitamura
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

/**
 * Separate Vite config for building the injected script as IIFE.
 * This is needed because the injected script runs in the page context
 * and cannot use ES module imports.
 */

import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  build: {
    lib: {
      entry: resolve(__dirname, 'src/injected/index.ts'),
      name: 'WebAuthnDevToolsInjected',
      formats: ['iife'],
      fileName: () => 'injected.js',
    },
    outDir: 'dist',
    emptyOutDir: false, // Don't clear dist, main build already populated it
    minify: true,
    sourcemap: true,
    rollupOptions: {
      output: {
        // Ensure all code is inlined, no external dependencies
        inlineDynamicImports: true,
      },
    },
  },
});
