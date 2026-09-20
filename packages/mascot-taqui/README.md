# mascot-taqui

Taqui, a cursor-aware mascot. One vanilla runtime, thin adapters, and a CLI that drops him into a project as a single import. No animation libraries.

```tsx
import { Mascot } from 'mascot-taqui/react'

<Mascot className="bg-yellow-400" size={140} label="Taqui" />
```

Sprite sheets are copied into your app’s static folder. You do not pass `directions` / `reactions` unless you are swapping characters.

## Install

```bash
# Add default mascot (Taqui)
npx mascot-taqui add --nextjs

# Add a built-in preset mascot (Fox, Pixel Fox, Ink, Riso, etc.)
npx mascot-taqui add fox --nextjs
npx mascot-taqui add fox-pixel --react

# Add any custom mascot created in Mascen Studio by ID / code
npx mascot-taqui add <mascot-id> --nextjs
```

Omit the framework flag and the CLI automatically detects Next.js, Vite React, Vue, Svelte, Angular, Astro, or plain HTML from the files in the current directory.

### What `add [code]` does:

1. **Resolves the mascot**: Loads built-in presets offline (`taqui`, `fox`, `fox-pixel`, `fox-ink`, `fox-riso`, `fox-paper`, `fox-sketch`) or fetches custom metadata & WebP sprite sheets from Mascen Studio.
2. **Copies assets**: Places `${slug}-directions.webp` and `${slug}-reactions.webp` directly into your framework's public asset directory (`public/mascots/`, `src/assets/`, or `static/`).
3. **Generates pre-bound wrapper**: Writes a typed `<Mascot />` component with `label`, `directions`, and `reactions` already wired for your framework.
4. **Installs runtime**: Adds `mascot-taqui` to your `package.json` (skip with `--copy-only`).

```bash
npx mascot-taqui add fox --dry-run
npx mascot-taqui add fox --force
npx mascot-taqui add fox --copy-only
```

`npx add mascot-taqui` is not valid npm — the binary lives on this package, so the command is `npx mascot-taqui add [code]`.

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
      size={240}
      label="Taqui"
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
<mascot-taqui size="240" label="Taqui"></mascot-taqui>
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
| `size` | `size` | `240` | Square CSS pixels |
| `label` | `label` | `"Taqui"` | Accessible name |
| `className` | `class` | | Host class (backgrounds work; we do not set an inline `background`) |
| `goToSleep` | `go-to-sleep` | `false` | When true, reaction is "sleepy" and pointer tracking/blinks are paused |
| `reaction` | `reaction` | `null` | Declarative expression override (`"sleepy"`, `"heart"`, `"wink"`, etc.) |
| `look` | `look` | `"center"` | Declarative glance angle |
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
