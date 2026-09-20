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
import { planFor, type MascotMetadata } from './templates'

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

interface ResolvedMascot {
  name: string
  slug: string
  localDirectionsSrc?: string
  localReactionsSrc?: string
  directionsData?: Buffer
  reactionsData?: Buffer
}

function formatMascotName(slug: string): string {
  return slug
    .split('-')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ')
}

async function resolveMascot(code: string): Promise<ResolvedMascot> {
  const cleanCode = (code || 'taqui').toLowerCase().trim()
  const assetSrc = join(PACKAGE_ROOT, 'assets')

  // 1. Only the default mascot (taqui) is bundled locally with the package
  if (cleanCode === 'taqui') {
    const localDir = join(assetSrc, 'taqui-directions.webp')
    const localReact = join(assetSrc, 'taqui-reactions.webp')
    if (existsSync(localDir) && existsSync(localReact)) {
      return {
        name: 'Taqui',
        slug: 'taqui',
        localDirectionsSrc: localDir,
        localReactionsSrc: localReact,
      }
    }
  }

  // 2. Fetch dynamically from Mascen remote registry / database API
  const registryUrl = (
    process.env.MASCEN_REGISTRY_URL ||
    process.env.NEXT_PUBLIC_APP_URL ||
    'https://mascen.vercel.app'
  ).replace(/\/+$/, '')

  let apiRes: Response | null = null
  let effectiveRegistry = registryUrl

  try {
    apiRes = await fetch(`${registryUrl}/api/mascot/${encodeURIComponent(cleanCode)}`, {
      signal: AbortSignal.timeout(8000),
    })
  } catch {
    // Local development fallback if primary endpoint fails
    if (registryUrl !== 'http://localhost:3000') {
      try {
        const localRes = await fetch(`http://localhost:3000/api/mascot/${encodeURIComponent(cleanCode)}`, {
          signal: AbortSignal.timeout(4000),
        })
        if (localRes.ok) {
          apiRes = localRes
          effectiveRegistry = 'http://localhost:3000'
        }
      } catch {
        // Ignore fallback error
      }
    }
  }

  // If primary returned 404 or error, also check local server during dev
  if ((!apiRes || !apiRes.ok) && effectiveRegistry !== 'http://localhost:3000') {
    try {
      const localRes = await fetch(`http://localhost:3000/api/mascot/${encodeURIComponent(cleanCode)}`, {
        signal: AbortSignal.timeout(4000),
      })
      if (localRes.ok) {
        apiRes = localRes
        effectiveRegistry = 'http://localhost:3000'
      }
    } catch {
      // Ignore
    }
  }

  if (!apiRes || !apiRes.ok) {
    throw new Error(
      `Mascot "${cleanCode}" not found in Mascen database or presets. Ensure it is a valid preset or a published mascot ID.`
    )
  }

  const meta = (await apiRes.json()) as {
    id: string
    name: string
    slug: string
    directionsUrl: string
    reactionsUrl: string
  }

  const name = meta.name || formatMascotName(cleanCode)
  const slug = (meta.slug || cleanCode).toLowerCase().replace(/[^a-z0-9_-]/g, '')

  async function downloadAsset(url: string): Promise<Buffer> {
    if (url.startsWith('data:image/')) {
      const base64 = url.split(',')[1] || ''
      return Buffer.from(base64, 'base64')
    }
    const fullUrl = url.startsWith('http') ? url : `${effectiveRegistry}/${url.replace(/^\/+/, '')}`
    const res = await fetch(fullUrl, { signal: AbortSignal.timeout(15000) })
    if (!res.ok) throw new Error(`Failed to download sprite asset from ${fullUrl} (HTTP ${res.status})`)
    const ab = await res.arrayBuffer()
    return Buffer.from(ab)
  }

  const [directionsData, reactionsData] = await Promise.all([
    downloadAsset(meta.directionsUrl),
    downloadAsset(meta.reactionsUrl),
  ])

  return {
    name,
    slug,
    directionsData,
    reactionsData,
  }
}

export async function addMascot(cwd: string, argv: string[]): Promise<void> {
  const copyOnly = argv.includes('--copy-only') || argv.includes('--no-install')
  const dryRun = argv.includes('--dry-run')
  const framework: Framework = parseFrameworkFlag(argv) ?? detectFramework(cwd)
  const manager = detectPackageManager(cwd)
  const rootHasAppDir = existsSync(join(cwd, 'app'))
  const isSvelteKit =
    existsSync(join(cwd, 'svelte.config.js')) || existsSync(join(cwd, 'svelte.config.ts'))

  // Extract positional mascot code (e.g. 'fox', 'taqui', or custom ID)
  const nonFlags = argv.filter((arg) => !arg.startsWith('-'))
  const codeArg = nonFlags[0] || 'taqui'

  const mascot = await resolveMascot(codeArg)

  const dirFileName = `${mascot.slug}-directions.webp`
  const reactFileName = `${mascot.slug}-reactions.webp`

  const isDefaultTaqui = mascot.slug === 'taqui'
  const assetDir = framework === 'angular' ? 'src/assets/mascots' : isSvelteKit ? 'static/mascots' : 'public/mascots'
  const publicPathPrefix = assetDir.replace(/^(public|static)\//, '')

  const mascotMeta: MascotMetadata = {
    name: mascot.name,
    slug: mascot.slug,
    directionsPath: `/${publicPathPrefix}/${dirFileName}`,
    reactionsPath: `/${publicPathPrefix}/${reactFileName}`,
  }

  const plan = planFor(framework, rootHasAppDir, isSvelteKit, mascotMeta)

  if (!copyOnly && !alreadyDepends(cwd) && !dryRun) {
    const [cmd, ...args] = installArgs(manager)
    const result = spawnSync(cmd!, args, { cwd, stdio: 'inherit' })
    if (result.status !== 0) {
      throw new Error(
        `Failed to install mascot-taqui with ${manager}. Re-run with --copy-only if you will install it yourself.`
      )
    }
  }

  const assetDest = join(cwd, plan.assetDir)
  if (!dryRun) mkdirSync(assetDest, { recursive: true })

  const targetDir = join(assetDest, dirFileName)
  const targetReact = join(assetDest, reactFileName)

  if (!dryRun) {
    if (mascot.localDirectionsSrc && mascot.localReactionsSrc) {
      copyFileSync(mascot.localDirectionsSrc, targetDir)
      copyFileSync(mascot.localReactionsSrc, targetReact)
    } else if (mascot.directionsData && mascot.reactionsData) {
      writeFileSync(targetDir, mascot.directionsData)
      writeFileSync(targetReact, mascot.reactionsData)
    }
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

  console.log(`mascot-taqui  framework=${framework} mascot=${mascot.name} (${mascot.slug})`)
  console.log(`assets       ${plan.assetDir}/${dirFileName}, ${reactFileName}`)
  for (const file of plan.files) console.log(`wrote        ${file.path}`)
  console.log('')
  console.log('Use it:')
  console.log('')
  console.log(plan.importHint)
  console.log('')
  console.log(`<Mascot className="bg-yellow-400" size={140} label="${mascot.name}" />`)
  for (const note of plan.extraNotes) console.log(`note  ${note}`)
  if (copyOnly) console.log('note  skipped package install (--copy-only)')
  if (dryRun) console.log('note  dry run; no files written')
}

export { PACKAGE_ROOT }
