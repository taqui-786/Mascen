import { parseArgs } from 'node:util'
import { addMascot } from './add'

const HELP = `mascot-taqui

Usage:
  npx mascot-taqui add [--nextjs|--react|--vue|--svelte|--angular|--astro|--html]
  npx mascot-taqui add --copy-only --force
  npx mascot-taqui add --dry-run

Drops Taqui into the current project: copies sprite sheets, writes a one-line
import wrapper, and installs this package unless --copy-only is set.

Flags:
  --nextjs --react --vue --svelte --angular --astro --html
  --copy-only / --no-install   skip npm install
  --force                      overwrite an existing wrapper
  --dry-run                    print the plan only
`

function main(argv: string[]) {
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
    addMascot(process.cwd(), argv.slice(1))
    return
  }

  console.error(`Unknown command "${command}".`)
  console.log(HELP)
  process.exitCode = 1
}

main(process.argv.slice(2))
