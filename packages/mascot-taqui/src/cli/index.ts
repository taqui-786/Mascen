import { parseArgs } from 'node:util'
import { addMascot } from './add'

const HELP = `mascot-taqui

Usage:
  npx mascot-taqui add [code] [--nextjs|--react|--vue|--svelte|--angular|--astro|--html]
  npx mascot-taqui add [code] --copy-only --force
  npx mascot-taqui add [code] --dry-run

Drops an interactive cursor-aware mascot into the current project:
1. Copies the mascot's directions & reactions sprite sheets into your static assets
2. Writes a pre-bound component wrapper (<Mascot />) tailored to your framework
3. Installs mascot-taqui into package.json unless --copy-only is set

Arguments:
  [code]                       Mascot preset (e.g. taqui, fox, fox-pixel, fox-ink)
                               or generated mascot ID from Mascen Studio. Default: taqui

Flags:
  --nextjs --react --vue --svelte --angular --astro --html
  --copy-only / --no-install   skip npm package install
  --force                      overwrite an existing wrapper
  --dry-run                    print the planned file operations only
`

async function main(argv: string[]) {
  const { positionals } = parseArgs({
    args: argv,
    allowPositionals: true,
    strict: false,
  })

  const command = positionals[0]
  if (!command || command === 'help' || argv.includes('--help') || argv.includes('-h')) {
    console.log(HELP)
    return
  }

  if (command === 'add' || command === 'init') {
    try {
      await addMascot(process.cwd(), argv.slice(1))
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err)
      console.error(`\x1b[31merror\x1b[0m ${msg}`)
      process.exitCode = 1
    }
    return
  }

  console.error(`Unknown command "${command}".`)
  console.log(HELP)
  process.exitCode = 1
}

void main(process.argv.slice(2))
