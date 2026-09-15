import { defineConfig } from 'tsup'

export default defineConfig([
  {
    entry: {
      'runtime/index': 'src/runtime/index.ts',
      'element/index': 'src/element/index.ts',
      'vue/index': 'src/vue/index.ts',
    },
    format: ['esm'],
    dts: true,
    splitting: false,
    clean: false,
    target: 'es2022',
    outDir: 'dist',
    external: ['vue'],
  },
  {
    entry: { 'react/index': 'src/react/index.ts' },
    format: ['esm'],
    dts: true,
    splitting: false,
    clean: false,
    target: 'es2022',
    outDir: 'dist',
    external: ['react', 'react/jsx-runtime'],
    esbuildOptions(options) {
      options.banner = { js: '"use client";' }
    },
  },
  {
    entry: { 'cli/index': 'src/cli/index.ts' },
    format: ['esm'],
    dts: false,
    splitting: false,
    clean: false,
    target: 'es2022',
    outDir: 'dist',
    banner: { js: '#!/usr/bin/env node' },
  },
])
