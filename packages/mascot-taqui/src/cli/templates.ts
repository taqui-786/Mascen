import type { Framework } from './detect'

export type MascotMetadata = {
  name: string
  slug: string
  directionsPath: string
  reactionsPath: string
}

export type WritePlan = {
  assetDir: string
  files: { path: string; contents: string }[]
  importHint: string
  extraNotes: string[]
}

export function buildReactWrapper(mascot: MascotMetadata): string {
  return `'use client'

import { Mascot as BaseMascot, type MascotProps } from 'mascot-taqui/react'

export function Mascot(props: MascotProps) {
  return (
    <BaseMascot
      label="${mascot.name}"
      directions="${mascot.directionsPath}"
      reactions="${mascot.reactionsPath}"
      {...props}
    />
  )
}

export type { MascotProps }
`
}

export function buildVueSfc(mascot: MascotMetadata): string {
  return `<script setup lang="ts">
import { Mascot } from 'mascot-taqui/vue'
</script>

<template>
  <Mascot
    label="${mascot.name}"
    directions="${mascot.directionsPath}"
    reactions="${mascot.reactionsPath}"
    v-bind="$attrs"
  />
</template>
`
}

export function buildSvelte(mascot: MascotMetadata): string {
  return `<script lang="ts">
  import { onMount } from 'svelte'
  import 'mascot-taqui'

  let {
    size = 240,
    label = '${mascot.name}',
    directions = '${mascot.directionsPath}',
    reactions = '${mascot.reactionsPath}',
    goToSleep = false,
    class: className = '',
  }: {
    size?: number
    label?: string
    directions?: string
    reactions?: string
    goToSleep?: boolean
    class?: string
  } = $props()

  onMount(() => {})
</script>

<mascot-taqui
  class={className}
  size={String(size)}
  label={label}
  directions={directions}
  reactions={reactions}
  go-to-sleep={goToSleep ? '' : undefined}
></mascot-taqui>
`
}

export function buildAstro(mascot: MascotMetadata): string {
  return `---
interface Props {
  size?: number
  label?: string
  directions?: string
  reactions?: string
  class?: string
  goToSleep?: boolean
}
const {
  size = 240,
  label = '${mascot.name}',
  directions = '${mascot.directionsPath}',
  reactions = '${mascot.reactionsPath}',
  class: className = '',
  goToSleep = false,
} = Astro.props
---

<mascot-taqui
  class={className}
  size={String(size)}
  label={label}
  directions={directions}
  reactions={reactions}
  go-to-sleep={goToSleep ? '' : undefined}
></mascot-taqui>

<script>
  import 'mascot-taqui'
</script>
`
}

export function buildHtmlSnippet(mascot: MascotMetadata): string {
  return `<script type="module">
  import 'mascot-taqui'
</script>
<mascot-taqui
  size="140"
  label="${mascot.name}"
  directions="${mascot.directionsPath}"
  reactions="${mascot.reactionsPath}"
></mascot-taqui>
`
}

export function buildAngularNote(mascot: MascotMetadata): string {
  return `import { CUSTOM_ELEMENTS_SCHEMA, Component } from '@angular/core'

@Component({
  selector: 'app-mascot',
  standalone: true,
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  template: \`<mascot-taqui size="140" label="${mascot.name}" directions="${mascot.directionsPath}" reactions="${mascot.reactionsPath}"></mascot-taqui>\`,
})
export class MascotComponent {
  constructor() {
    void import('mascot-taqui')
  }
}
`
}

export function planFor(
  framework: Framework,
  rootHasAppDir: boolean,
  isSvelteKit: boolean,
  mascot: MascotMetadata = {
    name: 'Taqui',
    slug: 'taqui',
    directionsPath: '/mascots/taqui-directions.webp',
    reactionsPath: '/mascots/taqui-reactions.webp',
  }
): WritePlan {
  switch (framework) {
    case 'nextjs':
      return {
        assetDir: 'public/mascots',
        files: [
          {
            path: rootHasAppDir ? 'app/components/mascot.tsx' : 'src/components/mascot.tsx',
            contents: buildReactWrapper(mascot),
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
        files: [{ path: 'src/components/mascot.tsx', contents: buildReactWrapper(mascot) }],
        importHint: `import { Mascot } from './components/mascot'`,
        extraNotes: [],
      }
    case 'vue':
      return {
        assetDir: 'public/mascots',
        files: [{ path: 'src/components/Mascot.vue', contents: buildVueSfc(mascot) }],
        importHint: `import Mascot from './components/Mascot.vue'`,
        extraNotes: [],
      }
    case 'svelte':
      return {
        assetDir: isSvelteKit ? 'static/mascots' : 'public/mascots',
        files: [
          {
            path: isSvelteKit ? 'src/lib/Mascot.svelte' : 'src/lib/Mascot.svelte',
            contents: buildSvelte(mascot),
          },
        ],
        importHint: `import Mascot from '$lib/Mascot.svelte'`,
        extraNotes: [],
      }
    case 'astro':
      return {
        assetDir: 'public/mascots',
        files: [{ path: 'src/components/Mascot.astro', contents: buildAstro(mascot) }],
        importHint: `import Mascot from '../components/Mascot.astro'`,
        extraNotes: [],
      }
    case 'angular':
      return {
        assetDir: 'src/assets/mascots',
        files: [{ path: 'src/app/mascot.component.ts', contents: buildAngularNote(mascot) }],
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
        files: [{ path: 'mascot-taqui.html', contents: buildHtmlSnippet(mascot) }],
        importHint: buildHtmlSnippet(mascot),
        extraNotes: [
          'Point the module import at your bundler or a served copy of mascot-taqui/dist/element/index.js.',
        ],
      }
  }
}
