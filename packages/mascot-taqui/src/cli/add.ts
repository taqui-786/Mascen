import { copyFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { spawnSync } from 'node:child_process'
import {
  detectFramework,
  detectPackageManager,
  parseFrameworkFlag,
  type Framework,
  type PackageManager,
} from './detect'
import { planFor } from './templates'

function resolvePackageRoot(): string {
  const starts: string[] = []
  if (typeof import.meta.dirname === 'string') starts.push(import.meta.dirname)
  try {
    if (import.meta.url.startsWith('file:')) {
      starts.push(fileURLToPath(new URL('.', import.meta.url)))
    }
  } catch {
    // Vitest may rewrite import.meta.url to a non-file URL.
  }
  starts.push(process.cwd())

  for (const start of starts) {
    let dir = start
    while (true) {
      const marker = join(dir, 'assets', 'taqui-directions.webp')
      const pkg = join(dir, 'package.json')
      if (existsSync(marker) && existsSync(pkg)) return dir
      const parent = dirname(dir)
      if (parent === dir) break
      dir = parent
    }
  }
  throw new Error('Cannot locate the mascot-taqui package root (missing assets/taqui-directions.webp)')
}

const PACKAGE_ROOT = resolvePackageRoot()

const ASSETS = ['taqui-directions.webp', 'taqui-reactions.webp'] as const

function installArgs(manager: PackageManager): string[] {
  switch (manager) {
    case 'pnpm':
      return ['pnpm', 'add', 'mascot-taqui']
    case 'yarn':
      return ['yarn', 'add', 'mascot-taqui']
    case 'bun':
      return ['bun', 'add', 'mascot-taqui']
    default:
      return ['npm', 'install', 'mascot-taqui']
  }
}

function alreadyDepends(root: string): boolean {
  try {
    const pkg = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8')) as {
      dependencies?: Record<string, string>
      devDependencies?: Record<string, string>
    }
    return Boolean(pkg.dependencies?.['mascot-taqui'] || pkg.devDependencies?.['mascot-taqui'])
  } catch {
    return false
  }
}

export function addMascot(cwd: string, argv: string[]): void {
  const copyOnly = argv.includes('--copy-only') || argv.includes('--no-install')
  const dryRun = argv.includes('--dry-run')
  const framework: Framework = parseFrameworkFlag(argv) ?? detectFramework(cwd)
  const manager = detectPackageManager(cwd)
  const rootHasAppDir = existsSync(join(cwd, 'app'))
  const isSvelteKit = existsSync(join(cwd, 'svelte.config.js')) || existsSync(join(cwd, 'svelte.config.ts'))
  const plan = planFor(framework, rootHasAppDir, isSvelteKit)

  if (!copyOnly && !alreadyDepends(cwd) && !dryRun) {
    const [cmd, ...args] = installArgs(manager)
    const result = spawnSync(cmd!, args, { cwd, stdio: 'inherit' })
    if (result.status !== 0) {
      throw new Error(`Failed to install mascot-taqui with ${manager}. Re-run with --copy-only if you will install it yourself.`)
    }
  }

  const assetDest = join(cwd, plan.assetDir)
  const assetSrc = join(PACKAGE_ROOT, 'assets')

  if (!dryRun) mkdirSync(assetDest, { recursive: true })
  for (const file of ASSETS) {
    const from = join(assetSrc, file)
    const to = join(assetDest, file)
    if (!existsSync(from)) {
      throw new Error(`Missing packaged asset ${from}`)
    }
    if (!dryRun) copyFileSync(from, to)
  }

  for (const file of plan.files) {
    const dest = join(cwd, file.path)
    if (!dryRun) {
      mkdirSync(dirname(dest), { recursive: true })
      if (existsSync(dest) && !argv.includes('--force')) {
        console.log(`skip  ${file.path} (already exists, pass --force to overwrite)`)
        continue
      }
      writeFileSync(dest, file.contents)
    }
  }

  console.log(`mascot-taqui  framework=${framework}`)
  console.log(`assets       ${plan.assetDir}/${ASSETS.join(', ')}`)
  for (const file of plan.files) console.log(`wrote        ${file.path}`)
  console.log('')
  console.log('Use it:')
  console.log('')
  console.log(plan.importHint)
  console.log('')
  console.log(`<Mascot className="bg-yellow-400" size={140} label="Taqui" />`)
  for (const note of plan.extraNotes) console.log(`note  ${note}`)
  if (copyOnly) console.log('note  skipped package install (--copy-only)')
  if (dryRun) console.log('note  dry run; no files written')
}

export { PACKAGE_ROOT }
