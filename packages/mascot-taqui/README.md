# mascot-taqui

Taqui, a cursor-aware mascot. One vanilla runtime, thin adapters, and a CLI that drops him into a project as a single import. No animation libraries.

```tsx
import { Mascot } from 'mascot-taqui/react'

<Mascot className="bg-yellow-400" size={140} label="Taqui" />
```

Sprite sheets are copied into your app’s static folder. You do not pass `directions` / `reactions` unless you are swapping characters.

## Install

```bash
npx mascot-taqui add --nextjs
```

Omit the flag and the CLI detects Next, Vite React, Vue, Svelte, Angular, Astro, or a plain HTML page from the files in the current directory.

What `add` does:

1. Installs `mascot-taqui` (skip with `--copy-only`)
2. Copies `taqui-directions.webp` and `taqui-reactions.webp` into `public/mascots` (or `static/`, or `src/assets/`)
3. Writes a one-line wrapper so the rest of the app imports from your own components folder

```bash
npx mascot-taqui add --dry-run
npx mascot-taqui add --force
```

`npx add mascot-taqui` is not valid npm — the binary lives on this package, so the command is `npx mascot-taqui add`.

## Usage

### React / Next.js

```tsx
'use client'

import { Mascot } from 'mascot-taqui/react'
// or, after the CLI: import { Mascot } from '@/components/mascot'

export function Header() {
  return (
    <Mascot
      className="bg-yellow-400"
      size={140}
      label="Taqui"
      expressionOnLoad
    />
  )
}
```

The Next App Router wrapper already contains `'use client'`.

If you depend on a local checkout (`"mascot-taqui": "file:../mascot-taqui"`), point Turbopack at the parent folder so it can resolve the linked package:

```ts
import path from 'node:path'

const nextConfig = {
  transpilePackages: ['mascot-taqui'],
  turbopack: { root: path.join(import.meta.dirname, '..') },
}
```

A published npm install does not need this.

### Any other framework (web component)

```html
<script type="module">
  import 'mascot-taqui'
</script>
<mascot-taqui size="140" label="Taqui" expression-on-load></mascot-taqui>
```

Works in Vue, Svelte, Angular (`CUSTOM_ELEMENTS_SCHEMA`), Astro, Deno Fresh, and static HTML. The widget needs a browser DOM. Node, Bun, and Deno run the **CLI**; they do not track a cursor in a headless process.

### Vue adapter

```vue
<script setup>
import { Mascot } from 'mascot-taqui/vue'
</script>
<template>
  <Mascot :size="140" label="Taqui" />
</template>
```

### Runtime (tests, custom adapters)

```ts
import { createMascot } from 'mascot-taqui/runtime'

const handle = createMascot(buttonElement, {
  directions: '/mascots/taqui-directions.webp',
  reactions: '/mascots/taqui-reactions.webp',
})
handle.boop()
handle.destroy()
```

## Props / attributes

| React / Vue | Web component | Default | |
| --- | --- | --- | --- |
| `size` | `size` | `140` | Square CSS pixels |
| `label` | `label` | `"Taqui"` | Accessible name |
| `className` | `class` | | Host class (backgrounds work; we do not set an inline `background`) |
| `expressionOnLoad` | `expression-on-load` | `false` | Short “awake” sequence after both sheets decode |
| `idleBlink` | `idle-blink` | `true` | Occasional blink while idle |
| `followPointer` | `follow-pointer` | `true` | Head tracks a fine pointer |
| `disabled` | `disabled` | `false` | No tracking, no boop |
| `directions` / `reactions` | same | bundled Taqui paths | Override sheets |
| `onBoop` `onLook` `onExpression` | events | | |

Keyboard: the host is a button. Space / Enter boops. Arrow keys glance.

`prefers-reduced-motion: reduce` skips the squash, the load greeting, and idle blinks. Looking still works.

## How it looks

The pointer is mapped onto the 3×3 sheet as a **pad** (center dead zone + eight neighbours), not as pie slices. The dead zone scales with `size`. See [ATLAS.md](./ATLAS.md) for cell order.

Click: blink → heart / sparkle / delighted. Four rapid clicks: dizzy.

## License

MIT © Md Taqui Imam
