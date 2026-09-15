import type { Framework } from './detect'

export type WritePlan = {
  assetDir: string
  files: { path: string; contents: string }[]
  importHint: string
  extraNotes: string[]
}

const REACT_WRAPPER = `'use client'

export { Mascot } from 'mascot-taqui/react'
export type { MascotProps } from 'mascot-taqui/react'
`

const VUE_SFC = `<script setup lang="ts">
import { Mascot } from 'mascot-taqui/vue'
</script>

<template>
  <Mascot v-bind="$attrs" />
</template>
`

const SVELTE = `<script lang="ts">
  import { onMount } from 'svelte'
  import 'mascot-taqui'

  let {
    size = 140,
    label = 'Taqui',
    expressionOnLoad = false,
    class: className = '',
  }: {
    size?: number
    label?: string
    expressionOnLoad?: boolean
    class?: string
  } = $props()

  onMount(() => {})
</script>

<mascot-taqui
  class={className}
  size={String(size)}
  label={label}
  expression-on-load={expressionOnLoad ? '' : undefined}
></mascot-taqui>
`

const ASTRO = `---
interface Props {
  size?: number
  label?: string
  class?: string
  expressionOnLoad?: boolean
}
const { size = 140, label = 'Taqui', class: className = '', expressionOnLoad = false } = Astro.props
---

<mascot-taqui
  class={className}
  size={String(size)}
  label={label}
  expression-on-load={expressionOnLoad ? '' : undefined}
></mascot-taqui>

<script>
  import 'mascot-taqui'
</script>
`

const HTML_SNIPPET = `<script type="module">
  import 'mascot-taqui'
</script>
<mascot-taqui size="140" label="Taqui"></mascot-taqui>
`

const ANGULAR_NOTE = `import { CUSTOM_ELEMENTS_SCHEMA, Component } from '@angular/core'

@Component({
  selector: 'app-mascot',
  standalone: true,
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  template: \`<mascot-taqui size="140" label="Taqui"></mascot-taqui>\`,
})
export class MascotComponent {
  constructor() {
    void import('mascot-taqui')
  }
}
`

export function planFor(framework: Framework, rootHasAppDir: boolean, isSvelteKit: boolean): WritePlan {
  switch (framework) {
    case 'nextjs':
      return {
        assetDir: 'public/mascots',
        files: [
          {
            path: rootHasAppDir ? 'app/components/mascot.tsx' : 'src/components/mascot.tsx',
            contents: REACT_WRAPPER,
          },
        ],
        importHint: rootHasAppDir
          ? `import { Mascot } from '@/components/mascot'`
          : `import { Mascot } from '@/components/mascot'`,
        extraNotes: [
          'Mark the parent as a Client Component, or keep importing from app/components/mascot.tsx (it already has "use client").',
          'If path aliases are not set, import from "./components/mascot" relative to the route file.',
        ],
      }
    case 'react':
      return {
        assetDir: 'public/mascots',
        files: [{ path: 'src/components/mascot.tsx', contents: REACT_WRAPPER }],
        importHint: `import { Mascot } from './components/mascot'`,
        extraNotes: [],
      }
    case 'vue':
      return {
        assetDir: 'public/mascots',
        files: [{ path: 'src/components/Mascot.vue', contents: VUE_SFC }],
        importHint: `import Mascot from './components/Mascot.vue'`,
        extraNotes: [],
      }
    case 'svelte':
      return {
        assetDir: isSvelteKit ? 'static/mascots' : 'public/mascots',
        files: [
          {
            path: isSvelteKit ? 'src/lib/Mascot.svelte' : 'src/lib/Mascot.svelte',
            contents: SVELTE,
          },
        ],
        importHint: `import Mascot from '$lib/Mascot.svelte'`,
        extraNotes: [],
      }
    case 'astro':
      return {
        assetDir: 'public/mascots',
        files: [{ path: 'src/components/Mascot.astro', contents: ASTRO }],
        importHint: `import Mascot from '../components/Mascot.astro'`,
        extraNotes: [],
      }
    case 'angular':
      return {
        assetDir: 'src/assets/mascots',
        files: [{ path: 'src/app/mascot.component.ts', contents: ANGULAR_NOTE }],
        importHint: `import { MascotComponent } from './mascot.component'`,
        extraNotes: [
          'Add CUSTOM_ELEMENTS_SCHEMA to the component or NgModule that renders <mascot-taqui>.',
          'Serve assets from src/assets/mascots (Angular copies this folder by default).',
        ],
      }
    case 'html':
    default:
      return {
        assetDir: 'public/mascots',
        files: [{ path: 'mascot-taqui.html', contents: HTML_SNIPPET }],
        importHint: HTML_SNIPPET,
        extraNotes: [
          'Point the module import at your bundler or a served copy of mascot-taqui/dist/element/index.js.',
        ],
      }
  }
}
