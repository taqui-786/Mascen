import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

export type Framework =
  | 'nextjs'
  | 'react'
  | 'vue'
  | 'svelte'
  | 'angular'
  | 'astro'
  | 'html'

export type PackageManager = 'npm' | 'pnpm' | 'yarn' | 'bun'

export function detectPackageManager(root: string): PackageManager {
  if (existsSync(join(root, 'bun.lock')) || existsSync(join(root, 'bun.lockb'))) return 'bun'
  if (existsSync(join(root, 'pnpm-lock.yaml'))) return 'pnpm'
  if (existsSync(join(root, 'yarn.lock'))) return 'yarn'
  return 'npm'
}

function readJson(path: string): Record<string, unknown> | null {
  try {
    return JSON.parse(readFileSync(path, 'utf8')) as Record<string, unknown>
  } catch {
    return null
  }
}

function hasDep(pkg: Record<string, unknown> | null, name: string): boolean {
  if (!pkg) return false
  for (const key of ['dependencies', 'devDependencies', 'peerDependencies']) {
    const bag = pkg[key]
    if (bag && typeof bag === 'object' && name in (bag as object)) return true
  }
  return false
}

function hasFile(root: string, names: string[]): boolean {
  return names.some((name) => existsSync(join(root, name)))
}

export function detectFramework(root: string): Framework {
  const pkg = readJson(join(root, 'package.json'))

  if (hasFile(root, ['next.config.ts', 'next.config.js', 'next.config.mjs', 'next.config.mts'])) {
    return 'nextjs'
  }
  if (hasDep(pkg, 'next')) return 'nextjs'

  if (hasFile(root, ['angular.json'])) return 'angular'
  if (hasDep(pkg, '@angular/core')) return 'angular'

  if (hasFile(root, ['astro.config.ts', 'astro.config.js', 'astro.config.mjs'])) return 'astro'
  if (hasDep(pkg, 'astro')) return 'astro'

  if (hasFile(root, ['svelte.config.js', 'svelte.config.ts'])) return 'svelte'
  if (hasDep(pkg, '@sveltejs/kit') || hasDep(pkg, 'svelte')) return 'svelte'

  if (hasFile(root, ['nuxt.config.ts', 'nuxt.config.js', 'nuxt.config.mjs'])) return 'vue'
  if (hasDep(pkg, 'vue') || hasDep(pkg, 'nuxt')) return 'vue'

  if (hasDep(pkg, 'react')) return 'react'

  return 'html'
}

export function parseFrameworkFlag(argv: string[]): Framework | null {
  const flags: Record<string, Framework> = {
    '--nextjs': 'nextjs',
    '--react': 'react',
    '--vue': 'vue',
    '--svelte': 'svelte',
    '--angular': 'angular',
    '--astro': 'astro',
    '--html': 'html',
    '--nuxt': 'vue',
  }
  for (const arg of argv) {
    if (flags[arg]) return flags[arg]!
  }
  return null
}
